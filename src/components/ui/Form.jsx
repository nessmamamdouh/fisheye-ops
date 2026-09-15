/**
 * Form — thin layout wrappers for label + field + helper/error text, so
 * every form in the app lays those three out identically instead of each
 * screen hand-rolling its own spacing.
 *
 * @example
 * <Form.Field>
 *   <Form.Label required>Client name</Form.Label>
 *   <Input value={name} onChange={e => setName(e.target.value)} error={!name.trim()} />
 *   {!name.trim() && <Form.ErrorText>Required</Form.ErrorText>}
 * </Form.Field>
 */
function Field({ className = "", children }) {
  return <div className={["flex flex-col gap-1.5", className].join(" ")}>{children}</div>;
}

function Label({ required = false, className = "", children }) {
  return (
    <label className={["font-sans text-xs font-semibold text-stone-600 dark:text-stone-300", className].join(" ")}>
      {children}
      {required && <span className="text-error-600 ml-0.5">*</span>}
    </label>
  );
}

function HelperText({ className = "", children }) {
  return <p className={["m-0 font-sans text-[11px] text-stone-400", className].join(" ")}>{children}</p>;
}

function ErrorText({ className = "", children }) {
  return <p className={["m-0 font-sans text-[11px] font-medium text-error-600", className].join(" ")}>{children}</p>;
}

function Row({ className = "", children }) {
  return <div className={["grid grid-cols-1 sm:grid-cols-2 gap-4", className].join(" ")}>{children}</div>;
}

const Form = { Field, Label, HelperText, ErrorText, Row };
export default Form;
