import { loadTemplate } from '../templates/registry.js';
(() => {
  "use strict";

  const currentId = new URLSearchParams(location.search).get("id");
  const title = document.querySelector("#editor-title");
  const status = document.querySelector("#editor-status");
  const list = document.querySelector("#related-templates");
  const listStatus = document.querySelector("#list-status");

  function setOptionalText(selector, text) {
    const element = document.querySelector(selector);
    element.textContent = text || "";
    element.hidden = !text;
  }

  async function showTemplate(card) {
    const definition = await loadTemplate(currentId);
    const settings = definition ? { author: definition.author, ...definition.size } : {};
    title.textContent = card.title || "페어틀 편집";
    document.title = title.textContent + " | 페어틀 편집";
    setOptionalText("#editor-tag", card.tag);
    document.querySelector("#editor-tag").classList.toggle("editor-tag--red", !!card.tagRed);
    setOptionalText("#editor-credit", settings.author);
    const width = settings.width > 0 ? settings.width : 1920;
    const height = settings.height > 0 ? settings.height : 1080;
    document.querySelector("#konva-container").style.setProperty("--canvas-ratio", width + " / " + height);
    window.editorTemplate = {
      ...settings, definition, id: currentId, title: card.title, tag: card.tag, width, height
    };
    fitCanvas();
    window.dispatchEvent(new CustomEvent("editor:ready", { detail: window.editorTemplate }));
  }

  async function loadTemplates() {
    try {
      const response = await fetch("index.html");
      if (!response.ok) throw new Error("메인 페이지 로드 실패");
      const doc = new DOMParser().parseFromString(await response.text(), "text/html");
      const seen = new Set();
      const cards = [...doc.querySelectorAll("#template-gallery .template-card")].flatMap(anchor => {
        const url = new URL(anchor.getAttribute("href"), response.url);
        const id = url.searchParams.get("id");
        const img = anchor.querySelector("img");
        if (!id || !img || seen.has(id) || url.origin !== location.origin) return [];
        seen.add(id);
        return [{
          id, href: url.href,
          image: new URL(img.getAttribute("src"), response.url).href,
          title: anchor.querySelector(".template-title")?.textContent.trim() || img.alt,
          tag: anchor.querySelector(".template-tag")?.textContent.trim() || "",
          tagRed: anchor.querySelector(".template-tag")?.classList.contains("template-tag--red") || false
        }];
      });

      const current = cards.find(card => card.id === currentId);
      if (current) {
        await showTemplate(current);
      } else {
        title.textContent = "페어틀을 찾을 수 없어요";
        status.textContent = "메인으로 돌아가 페어틀을 선택해 주세요.";
        status.hidden = false;
      }

      for (const card of cards.filter(card => card.id !== currentId)) {
        const link = document.createElement("a");
        link.className = "related-card";
        link.href = card.href;
        link.setAttribute("aria-label", card.title);
        const image = document.createElement("img");
        image.src = card.image;
        image.alt = card.title;
        image.loading = "lazy";
        image.addEventListener("error", () => {
          const fallback = document.createElement("span");
          fallback.className = "missing-image";
          fallback.textContent = card.title;
          image.replaceWith(fallback);
        }, { once: true });
        link.append(image);
        if (card.tag) {
          const tag = document.createElement("span");
          tag.className = "template-tag";
          tag.classList.toggle("template-tag--red", card.tagRed);
          tag.textContent = card.tag;
          link.append(tag);
        }
        const caption = document.createElement("strong");
        caption.className = "template-title";
        caption.textContent = card.title;
        link.append(caption);
        list.append(link);
      }
      listStatus.textContent = list.children.length ? "" : "다른 페어틀이 아직 없어요.";
    } catch (error) {
      listStatus.textContent = "목록을 불러오지 못했어요. 메인으로 돌아가 다시 열어 주세요.";
      status.textContent = "페어틀 정보를 불러오지 못했어요.";
      status.hidden = false;
      console.error(error);
    }
  }

  const canvasArea = document.querySelector(".canvas-area");
  const container = document.querySelector("#konva-container");

  function fitCanvas() {
    const settings = window.editorTemplate || { width: 1920, height: 1080 };
    const style = getComputedStyle(canvasArea);
    const availableWidth = Math.max(0, canvasArea.clientWidth
      - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight));
    const availableHeight = Math.max(0, canvasArea.clientHeight
      - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom));
    const scale = Math.min(availableWidth / settings.width, availableHeight / settings.height);
    const width = settings.width * scale;
    const height = settings.height * scale;
    container.style.width = width + "px";
    container.style.height = height + "px";
    container.dispatchEvent(new CustomEvent("editor:resize", {
      detail: { width, height, scale, originalWidth: settings.width, originalHeight: settings.height }
    }));
  }

  const canvasObserver = new ResizeObserver(fitCanvas);
  window.addEventListener('editor:layout',fitCanvas);
  canvasObserver.observe(canvasArea);

  const sidebarToggle = document.querySelector(".sidebar-toggle");
  const sidebar = document.querySelector("#template-sidebar");
  sidebarToggle.addEventListener("click", () => {
    const collapsed = document.body.classList.toggle(
      "sidebar-collapsed"
    );
    sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
    sidebarToggle.setAttribute(
      "aria-label",
      collapsed
        ? "다른 페어틀 목록 펼치기"
        : "다른 페어틀 목록 접기"
    );
    sidebar.inert = collapsed;
  });

  const toolsToggle = document.querySelector(".tools-toggle");
  toolsToggle.addEventListener("click", () => {
    const collapsed = document.body.classList.toggle("tools-collapsed");
    toolsToggle.setAttribute("aria-expanded", String(!collapsed));
    toolsToggle.setAttribute("aria-label", collapsed ? "편집 도구 열기" : "편집 도구 닫기");
  });

  document.addEventListener("pointerdown", (event) => {
    if (!window.matchMedia("(max-width: 1024px)").matches) return;
    if (document.body.classList.contains("tools-collapsed")) return;

    if (event.target.closest(".editor-tools button")) return;

    document.body.classList.add("tools-collapsed");
    toolsToggle.setAttribute("aria-expanded", "false");
    toolsToggle.setAttribute("aria-label", "편집 도구 열기");
  }, { capture: true });

  loadTemplates();
})();
