// This file helps the linter understand Tailwind CSS directives
declare module 'tailwindcss/tailwind' {
  const content: { [className: string]: string };
  export default content;
}

// Add CSS module declarations
declare module '*.css' {
  const classes: { [className: string]: string };
  export default classes;
}

// Add support for Tailwind directives
interface CSSRules {
  '@tailwind': string;
  '@layer': string;
}
