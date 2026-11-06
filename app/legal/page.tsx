"use client";

import { useState } from "react";
import ChatWindow from "@/components/ChatWindow";
import LegalAidCard from "@/components/LegalAidCard";
import { consultationPrompts } from "@/data/consultationPrompts";
import { LEGAL_AID_CHECKED_ON, legalAidOrgs } from "@/data/legalAid";

function ConsultationChecklist() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copyStatus, setCopyStatus] = useState("");

  // Flattened from the data, so the list keeps a steady order whatever order boxes are ticked in.
  const selectedQuestions = consultationPrompts
    .flatMap((prompt) => prompt.questions)
    .filter((question) => selected.has(question));

  function toggle(question: string) {
    setCopyStatus("");
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(question)) next.delete(question);
      else next.add(question);
      return next;
    });
  }

  async function copyList() {
    const text = selectedQuestions.map((question) => `- ${question}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Copied your questions.");
    } catch {
      setCopyStatus("We couldn’t copy automatically. You can select the questions and copy them yourself.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        {consultationPrompts.map((prompt) => (
          <fieldset key={prompt.category}>
            <legend className="font-semibold">{prompt.category}</legend>
            <div className="mt-2 space-y-1">
              {prompt.questions.map((question) => (
                <label
                  key={question}
                  className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-surface-muted"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(question)}
                    onChange={() => toggle(question)}
                    className="mt-1 size-5 shrink-0 accent-primary"
                  />
                  <span>{question}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      {/* top-24 keeps this clear of the sticky site header. */}
      <div className="self-start rounded-xl border border-border bg-surface p-5 shadow-sm lg:sticky lg:top-24">
        <h3 className="text-lg font-semibold">Your questions</h3>
        {selectedQuestions.length === 0 ? (
          <p className="mt-2">Questions you choose will appear here.</p>
        ) : (
          <>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              {selectedQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => void copyList()}
              className="mt-4 min-h-11 rounded-lg bg-primary px-4 py-2 font-medium text-primary-contrast hover:bg-primary-hover"
            >
              Copy my questions
            </button>
          </>
        )}
        <p role="status" className="mt-2 text-sm text-muted">
          {copyStatus}
        </p>
      </div>
    </div>
  );
}

export default function LegalPage() {
  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-3xl font-bold">Legal help</h1>
        <p className="mt-3 max-w-3xl text-lg">
          Learn about your rights, find people who can help, and get ready to talk with a lawyer or
          advocate. Go at your own pace, and use only what’s useful to you.
        </p>
        <p className="mt-3 max-w-3xl">
          This is general information, not legal advice. Nothing here files a report or notifies
          your school or anyone else.
        </p>
      </header>

      <section aria-labelledby="chat-heading">
        <h2 id="chat-heading" className="text-2xl font-semibold">
          Ask about your rights
        </h2>
        <p className="mt-2 mb-4 max-w-3xl">
          Your messages are sent to an AI service to generate answers. We don’t store your
          conversation, and it’s cleared when you refresh, close this tab, or use Quick Exit. AI
          answers can be wrong, so please check anything important with a lawyer or advocate.
        </p>
        <ChatWindow />
      </section>

      <section aria-labelledby="legal-aid-heading">
        <h2 id="legal-aid-heading" className="text-2xl font-semibold">
          Find legal help
        </h2>
        <p className="mt-2 mb-4 max-w-3xl">
          Services and availability can change, so check with each organization. Details were last
          checked on {LEGAL_AID_CHECKED_ON}. Website links open in this tab, so your conversation
          above may not be there when you come back.
        </p>
        <ul className="grid gap-4 md:grid-cols-2">
          {legalAidOrgs.map((org) => (
            <li key={org.name}>
              <LegalAidCard org={org} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="consultation-heading">
        <h2 id="consultation-heading" className="text-2xl font-semibold">
          Prepare for your consultation
        </h2>
        <p className="mt-2 mb-4 max-w-3xl">
          Choose any questions you’d like to ask. You don’t need to tell us anything about what
          happened, and you decide how much to share with a lawyer or advocate.
        </p>
        <ConsultationChecklist />
      </section>
    </div>
  );
}
