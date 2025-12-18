type ErrorAlertProps = {
  message: string;
};

/**
 * Error alert banner
 */
export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
      {message}
    </div>
  );
}
