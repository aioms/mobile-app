import { cn } from "@/lib/utils";
import { FC } from "react";

type Props = {
  message: string;
  extraClassName?: string;
};

const ErrorMessage: FC<Props> = ({ message, extraClassName }) => {
  if (!message) return null;

  return (
    <div className={cn("text-destructive text-xs mt-2", extraClassName)}>
      {message}
    </div>
  );
};

export default ErrorMessage;
