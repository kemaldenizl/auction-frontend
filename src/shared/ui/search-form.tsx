import { Search } from "lucide-react";
import Form from "next/form";

import { Input } from "./field";

/**
 * Search that lives in the URL.
 *
 * `next/form` submits with client-side navigation and still works without
 * JavaScript, so the result stays shareable and the page can be rendered on
 * the server. Active filters ride along as hidden fields; `page` deliberately
 * does not, because a new search starts from the first page.
 */
export function SearchForm({
  action,
  defaultValue,
  placeholder,
  label,
  hidden = {},
}: {
  action: string;
  defaultValue?: string;
  placeholder?: string;
  label: string;
  hidden?: Record<string, string | undefined>;
}) {
  const id = `${action.replace(/\W+/g, "-")}-search`;

  return (
    <Form action={action} className="relative w-full sm:w-72">
      {Object.entries(hidden).map(([name, value]) =>
        value ? (
          <input key={name} type="hidden" name={name} value={value} />
        ) : null,
      )}

      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle"
      />
      <Input
        id={id}
        type="search"
        name="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="rounded-full pl-10"
      />
    </Form>
  );
}
