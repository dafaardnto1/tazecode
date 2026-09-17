import { useState } from "react";

function toFormState(faq) {
  return {
    question: faq?.question || "",
    answer: faq?.answer || ""
  };
}

export default function FaqForm({ initial, onSubmit, onCancel, submitting }) {
  const [values, setValues] = useState(() => toFormState(initial));
  const [error, setError] = useState("");

  function set(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!values.question.trim() || !values.answer.trim()) {
      setError("Pertanyaan dan jawaban wajib diisi.");
      return;
    }
    try {
      await onSubmit({ question: values.question.trim(), answer: values.answer.trim() });
    } catch (err) {
      setError(err.message || "Gagal menyimpan.");
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      {error && <div className="admin-alert">{error}</div>}
      <div className="admin-field">
        <label htmlFor="question">Pertanyaan *</label>
        <input id="question" value={values.question} onChange={(e) => set("question", e.target.value)} placeholder="Berapa lama waktu pengerjaan?" />
      </div>
      <div className="admin-field">
        <label htmlFor="answer">Jawaban *</label>
        <textarea id="answer" rows={4} value={values.answer} onChange={(e) => set("answer", e.target.value)} />
      </div>
      <div className="admin-form-actions">
        <button type="button" className="admin-btn" onClick={onCancel}>Batal</button>
        <button type="submit" className="admin-btn primary" disabled={submitting}>
          {submitting ? "Menyimpan…" : "Simpan"}
        </button>
      </div>
    </form>
  );
}
