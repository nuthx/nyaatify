import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LabelInput({ form, title, id, placeholder = "", ...props }) {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor={id} className="text-right">{title}</Label>
      <Input
        id={id}
        {...form.register(id)}
        className="col-span-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
}
