import { defineConfig } from "vitepress";
import valenGrammar from "./valen.tmLanguage.json" with { type: "json" };

export default defineConfig({
  title: "Valen",
  description: "An ADT-first language for the JVM",
  head: [
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/npm/@fontsource-variable/lilex/index.min.css",
      },
    ],
  ],

  markdown: {
    languages: [valenGrammar as any],
  },

  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Reference", link: "/reference/types" },
      {
        text: "v0.1.0",
        link: "https://github.com/NaruseNia/valen-lang/releases/tag/v0.1.0",
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "What is Valen?", link: "/guide/what-is-valen" },
            { text: "Getting Started", link: "/guide/getting-started" },
            { text: "Hello, Valen", link: "/guide/hello-valen" },
          ],
        },
        {
          text: "Basics",
          items: [
            { text: "Variables & Types", link: "/guide/variables-and-types" },
            { text: "Functions", link: "/guide/functions" },
            { text: "Control Flow", link: "/guide/control-flow" },
            { text: "Strings", link: "/guide/strings" },
          ],
        },
        {
          text: "Data Modeling",
          items: [
            { text: "Classes", link: "/guide/classes" },
            { text: "Enums & ADTs", link: "/guide/enums" },
            { text: "Pattern Matching", link: "/guide/pattern-matching" },
            { text: "Generics", link: "/guide/generics" },
          ],
        },
        {
          text: "Abstraction",
          items: [
            { text: "Traits", link: "/guide/traits" },
            { text: "Error Handling", link: "/guide/error-handling" },
            { text: "Java Interop", link: "/guide/java-interop" },
          ],
        },
        {
          text: "Advanced",
          items: [
            { text: "Inline & Reified", link: "/guide/inline-reified" },
            { text: "Unsafe", link: "/guide/unsafe" },
            { text: "Annotations", link: "/guide/annotations" },
          ],
        },
      ],
      "/reference/": [
        {
          text: "Language Reference",
          items: [
            { text: "Types", link: "/reference/types" },
            { text: "Expressions", link: "/reference/expressions" },
            { text: "Functions", link: "/reference/functions" },
            { text: "Classes", link: "/reference/classes" },
            { text: "Enums", link: "/reference/enums" },
            { text: "Traits", link: "/reference/traits" },
            { text: "Pattern Matching", link: "/reference/patterns" },
            { text: "Error Model", link: "/reference/errors" },
            { text: "Modules & Visibility", link: "/reference/modules" },
            { text: "Annotations", link: "/reference/annotations" },
            { text: "Generics", link: "/reference/generics" },
            { text: "Java Interop", link: "/reference/java-interop" },
            { text: "Keywords", link: "/reference/keywords" },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/NaruseNia/valen-lang" },
    ],

    search: {
      provider: "local",
    },

    editLink: {
      pattern: "https://github.com/NaruseNia/valen-docs/edit/main/:path",
    },
  },
});
