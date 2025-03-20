import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schemaRules = (t) => ({
  trim: z.string()
    .trim(),
  required: z.string()
    .trim()
    .min(1, { message: t("validate.required") }),
  name: z.string()
    .trim()
    .min(2, { message: t("validate.name_2") })
    .max(40, { message: t("validate.name_40") }),
  url: z.string()
    .trim()
    .url({ message: t("validate.url_invalid") })
    .startsWith("http", { message: t("validate.url_http") })
    .refine(url => !url.endsWith("/"), { message: t("validate.url_slash") }),
  username: z.string()
    .trim()
    .min(1, { message: t("validate.username") }),
  password: z.string()
    .min(1, { message: t("validate.password") }),
  password8: z.string()
    .min(8, { message: t("validate.password_8") })
});

/**
 * Creates a custom form hook with field validation and default values
 * @param {Object} fields - Configuration object for form fields
 * @param {Object} fields[key] - Configuration for each field
 * @param {string} fields[key].schema - Name of the validation rule to use from schemaRules
 * @param {string} [fields[key].default=""] - Optional default value for the field, defaults to empty string
 * @returns {Function} - React hook that returns form handling methods from react-hook-form
 */
export const createForm = (fields) => {
  return () => {
    const { t } = useTranslation();
    const rules = schemaRules(t);
    
    // Build schema object from field definitions
    const schema = z.object(
      Object.entries(fields).reduce((acc, [key, config]) => ({
        ...acc,
        [key]: rules[config.schema]
      }), {})
    );

    // Build default values
    const defaultValues = Object.entries(fields).reduce((acc, [key, config]) => ({
      ...acc,
      [key]: config.default ?? ""
    }), {});

    return useForm({
      resolver: zodResolver(schema),
      defaultValues
    });
  };
};
