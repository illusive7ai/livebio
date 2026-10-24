/** The few parts of the Chrome extension API this extension uses, so it needs no extra package for types. */

declare const __SERVICE_URL__: string;
declare const __SITE_URL__: string;

declare module '*.css' {
  const css: string;
  export default css;
}

declare namespace chrome {
  namespace runtime {
    const id: string;
    function getURL(path: string): string;
    function sendMessage(message: unknown): Promise<unknown>;
    const onInstalled: { addListener(callback: () => void): void };
    const onMessage: {
      addListener(callback: (message: unknown, sender: unknown, sendResponse: (response: unknown) => void) => boolean | void): void;
    };
  }
  namespace tabs {
    interface Tab {
      id?: number;
      url?: string;
    }
    function query(info: { active?: boolean; currentWindow?: boolean }): Promise<Tab[]>;
    function create(info: { url: string }): Promise<Tab>;
  }
  namespace contextMenus {
    interface CreateProperties {
      id: string;
      title: string;
      contexts: string[];
      targetUrlPatterns?: string[];
    }
    interface OnClickData {
      menuItemId: string | number;
      linkUrl?: string;
      selectionText?: string;
    }
    function create(properties: CreateProperties): void;
    function removeAll(): Promise<void>;
    const onClicked: { addListener(callback: (info: OnClickData) => void): void };
  }
}
