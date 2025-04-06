declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// This helps TypeScript understand the @tailwind directives
declare module 'tailwindcss/tailwind' {
  const content: { [className: string]: string };
  export default content;
}
