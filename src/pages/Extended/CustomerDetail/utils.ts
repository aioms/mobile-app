// Map status color to Tailwind classes or similar
export const getBadgeStyles = (color: string) => {
  switch (color) {
    case "success":
      return "bg-green-100 text-green-600";
    case "warning":
      return "bg-yellow-100 text-yellow-600";
    case "danger":
      return "bg-red-100 text-red-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};
