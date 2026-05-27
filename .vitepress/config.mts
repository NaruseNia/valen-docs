import { defineConfig } from "vitepress";
import valenGrammar from "./valen.tmLanguage.json" with { type: "json" };

const guideSidebarEn = [
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
];

const referenceSidebarEn = [
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
];

const guideSidebarJa = [
  {
    text: "はじめに",
    items: [
      { text: "Valen とは？", link: "/ja/guide/what-is-valen" },
      { text: "セットアップ", link: "/ja/guide/getting-started" },
      { text: "Hello, Valen", link: "/ja/guide/hello-valen" },
    ],
  },
  {
    text: "基本",
    items: [
      { text: "変数と型", link: "/ja/guide/variables-and-types" },
      { text: "関数", link: "/ja/guide/functions" },
      { text: "制御フロー", link: "/ja/guide/control-flow" },
      { text: "文字列", link: "/ja/guide/strings" },
    ],
  },
  {
    text: "データモデリング",
    items: [
      { text: "クラス", link: "/ja/guide/classes" },
      { text: "enum と ADT", link: "/ja/guide/enums" },
      { text: "パターンマッチ", link: "/ja/guide/pattern-matching" },
      { text: "ジェネリクス", link: "/ja/guide/generics" },
    ],
  },
  {
    text: "抽象化",
    items: [
      { text: "トレイト", link: "/ja/guide/traits" },
      { text: "エラーハンドリング", link: "/ja/guide/error-handling" },
      { text: "Java 連携", link: "/ja/guide/java-interop" },
    ],
  },
  {
    text: "上級",
    items: [
      { text: "inline と reified", link: "/ja/guide/inline-reified" },
      { text: "unsafe と safe", link: "/ja/guide/unsafe" },
      { text: "アノテーション", link: "/ja/guide/annotations" },
    ],
  },
];

const referenceSidebarJa = [
  {
    text: "言語リファレンス",
    items: [
      { text: "型", link: "/ja/reference/types" },
      { text: "式と文", link: "/ja/reference/expressions" },
      { text: "関数", link: "/ja/reference/functions" },
      { text: "クラス", link: "/ja/reference/classes" },
      { text: "enum", link: "/ja/reference/enums" },
      { text: "トレイト", link: "/ja/reference/traits" },
      { text: "パターンマッチ", link: "/ja/reference/patterns" },
      { text: "失敗モデル", link: "/ja/reference/errors" },
      { text: "モジュールと可視性", link: "/ja/reference/modules" },
      { text: "アノテーション", link: "/ja/reference/annotations" },
      { text: "ジェネリクス", link: "/ja/reference/generics" },
      { text: "Java 連携", link: "/ja/reference/java-interop" },
      { text: "キーワード", link: "/ja/reference/keywords" },
    ],
  },
];

export default defineConfig({
  base: "/valen-docs/",
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

  locales: {
    root: {
      label: "English",
      lang: "en",
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
          "/guide/": guideSidebarEn,
          "/reference/": referenceSidebarEn,
        },
      },
    },
    ja: {
      label: "日本語",
      lang: "ja",
      description: "JVM 向け ADT 中心言語",
      themeConfig: {
        nav: [
          { text: "ガイド", link: "/ja/guide/getting-started" },
          { text: "リファレンス", link: "/ja/reference/types" },
          {
            text: "v0.1.0",
            link: "https://github.com/NaruseNia/valen-lang/releases/tag/v0.1.0",
          },
        ],
        sidebar: {
          "/ja/guide/": guideSidebarJa,
          "/ja/reference/": referenceSidebarJa,
        },
        outline: { label: "目次" },
        docFooter: { prev: "前のページ", next: "次のページ" },
        lastUpdated: { text: "最終更新" },
        returnToTopLabel: "トップに戻る",
        sidebarMenuLabel: "メニュー",
        darkModeSwitchLabel: "テーマ切替",
      },
    },
  },

  themeConfig: {
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
