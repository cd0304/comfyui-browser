import { app } from "../../scripts/app.js";
import { $el, ComfyDialog } from "../../scripts/ui.js";
import { api } from "../../scripts/api.js";

const browserUrl = "./browser/web/index.html";

const localStorageKey = 'comfyui-browser';

function getLocalConfig() {
  let localConfig = localStorage.getItem(localStorageKey);
  if (localConfig) {
    localConfig = JSON.parse(localConfig);
  } else {
    localConfig = {};
  }

  return localConfig;
}

function setLocalConfig(key, value) {
  let localConfig = getLocalConfig();
  localConfig[key] = value;
  localStorage.setItem(localStorageKey, JSON.stringify(localConfig));
}

class BrowserDialog extends ComfyDialog {
  constructor() {
    super();
    window.top.addEventListener("setBrowserSize", (event) => {
      const data = event.detail;
      console.log(100,data)
      this.toggleSidePanel(data)
    });
    

    const localConfig = getLocalConfig();
    let modalStyle = {
      left: "0px",
      top: "0px",
      width: "100%",
      height: "100%",
      maxWidth: "100%",
      maxHeight: "100%",
      minWidth: "24%",
      minHeight: "5%",
      padding: "6px",
      zIndex: 1000,
      resize: 'auto',
    };
    const cs = localConfig.modalStyles;
    if (cs) {
      modalStyle.left = cs.left;
      modalStyle.top = cs.top;
      // modalStyle.transform = cs.transform;
      modalStyle.height = cs.height;
      modalStyle.width = cs.width;
    }

    this.element = $el("div.comfy-modal", {
      id: "comfy-browser-dialog",
      parent: document.body,
      style: modalStyle,
    }, [
      $el("div.comfy-modal-content", {
        style: {
          width: "100%",
          height: "100%",
        },
      }, [
        $el("iframe", {
          id: "comfy-browser-iframe",
          src: browserUrl + "?timestamp=" + Date.now(),
          style: {
            width: "100%",
            height: "100%",
          },
        }),
        // ...this.createButtons(),
      ]),
		]);

    new ResizeObserver(
      this.onResize.bind(this)
    ).observe(this.element);

    window.toggleSidePanel = this.toggleSidePanel;
  }



  createButtons() {
    const closeBtn = $el("button", {
      type: "button",
      textContent: "Close",
      onclick: () => this.close(),
    });
    const browseBtn = $el("a", {
      href: browserUrl,
      target: "_blank",
    }, [
      $el("button", {
        type: "button",
        textContent: "Browse in new tab",
      }),
    ]);
    const toggleSidePanelBtn = $el("button", {
      type: "button",
      textContent: "Side/Center",
      onclick: () => this.toggleSidePanel(),
    });
    return [
      $el("div", {
        style: {
          marginTop: '10px'
        }
      }, [
        closeBtn,
        browseBtn,
        toggleSidePanelBtn,
        /*$el("span", {*/
          /*textContent: "Tips: press 'B' to toggle me",*/
          /*style: {*/
            /*color: "var(--input-text)",*/
            /*right: 0,*/
            /*position: "absolute",*/
            /*lineHeight: "28.5px",*/
            /*marginRight: "2px",*/
          /*},*/
        /*}),*/
      ]),
    ];
  }

  onResize() {
    const e = this.element;
    setLocalConfig('modalStyles', {
      left: e.style.left,
      top: e.style.top,
      transform: e.style.transform,
      height: e.style.height,
      width: e.style.width,
    });
  }

  toggleSidePanel(isFullScreen) {
    const e = this.element;
    if (isFullScreen) {
      e.style.left = '0px';
      e.style.top = '0px';
      e.style.transform = 'translate(-10px, -10px)';
      e.style.height = '100%';
      e.style.width = '100%';
    } else {
      var iframeElement = document.getElementById('comfy-browser-iframe');
      var height= 30;
      if (iframeElement) {
        // 获取iframe的内容文档
        var iframeContentDoc = iframeElement.contentDocument || iframeElement.contentWindow.document;
        
        // 现在你可以在这个文档上使用getElementById
        var menuElement = iframeContentDoc.getElementById('gdds_head');
        var height= menuElement.offsetHeight;
        
        if (menuElement) {
          console.log('找到了元素:', menuElement);
        } else {
          console.log('没有找到元素');
        }
      } else {
        console.log('没有找到iframe');
      }
      e.style.left = '0px';
      e.style.top = '0px';
      e.style.transform = 'translate(-10px, -10px)';
      e.style.height = height+'px';
      e.style.width = '100%';
    }

    setLocalConfig('modalStyles', {
      left: e.style.left,
      top: e.style.top,
      transform: e.style.transform,
      height: e.style.height,
      width: e.style.width,
    });
  }


  close() {
    this.element.style.display = "none";
  }

  show() {
    this.element.style.display = "flex";
    dispatchEvent(new Event('comfyuiBrowserShow'));
  }

  toggle() {
    const e = this.element;
    if (e.style.display === "none") {
      this.show();
    } else {
      this.close();
    }
  }
}

function showToast(text, onClick) {
  const toastId = 'comfy-browser-toast';
  let toast = document.getElementById(toastId);
  if (! toast) {
    toast = $el("p", {
      id: toastId,
      textContent: '',
      onclick: onClick,
      style: {
        position: 'fixed',
        top: '70%',
        left: '34%',
        zIndex: 999,
        backgroundColor: 'var(--comfy-menu-bg)',
        fontSize: '42px',
        color: 'green',
        padding: '8px',
        border: 'green',
        borderStyle: 'solid',
        borderRadius: '0.5rem',
        display: 'none',
      }
    });
    document.body.appendChild(toast);
  }

  toast.textContent = text;
  toast.style.display = 'block';

  setTimeout(() => {
    toast.style.display = 'none';
  }, 2000);
}

app.registerExtension({
  name: "ComfyUI.Browser",
  init() {
  },
  async setup() {
    const browserDialog = new BrowserDialog();
    browserDialog.show();
    document.addEventListener('keydown', (event) => {
      if (event.key === 'b') {
        if (event.target.matches('input, textarea')) {
          return;
        }

        browserDialog.toggle();
        event.preventDefault();
      }
    });

    app.ui.menuContainer.appendChild(
      $el("div.comfy-list", {
        style: {
          width: "100%",
          "border-style": "none",
          "margin-bottom": "none",
        }
      }, [
        $el("button", {
          id: "comfyui-browser-button",
          textContent: "Browser",
          title: "Browse and manage your outputs and collections",
          style: {
            "font-size": "20px",
            color: "red !important",
            //color: "var(--descrip-text) !important",
            width: "80%",
          },
          onclick: () => { browserDialog.show() },
        }),
        $el("button", {
          id: "comfyui-browser-collect-button",
          textContent: "💾",
          title: "Save workflow to collections",
          style: {
            width: "20%",
            "font-size": "17px",
          },
          onclick: (e) => {
            const saveBtn = e.target;
            const originBtnStyle = saveBtn.style.cssText;

            let filename = "workflow.json";
            const promptFilename = app.ui.settings.getSettingValue(
              "Comfy.PromptFilename",
              true,
            );
            if (promptFilename) {
              filename = prompt("Collect workflow as:", filename);
              if (!filename) return;
              if (!filename.toLowerCase().endsWith(".json")) {
                filename += ".json";
              }
            }
            app.graphToPrompt().then(async p => {
              const json = JSON.stringify(p.workflow, null, 2); // convert the data to a JSON string
              const res = await api.fetchApi("/browser/collections/workflows", {
                method: "POST",
                body: JSON.stringify({
                  filename: filename,
                  content: json,
                }),
              });
              if (res.ok) {
                saveBtn.style = originBtnStyle + "border-color: green;";
                showToast(
                  'Saved. Click me to open.',
                  () => { browserDialog.show() },
                );
              } else {
                saveBtn.style = originBtnStyle + "border-color: red;";
              }
              setTimeout(() => {
                saveBtn.style = originBtnStyle;
              }, 1000);
            });
          },
        }),
      ])
    );

    setTimeout(() => {
      var iframeElement = document.getElementById('comfy-browser-iframe');
      if (iframeElement) {
        // 获取iframe的内容文档
        var iframeContentDoc = iframeElement.contentDocument || iframeElement.contentWindow.document;
        
        // 现在你可以在这个文档上使用getElementById
        var menuElement = iframeContentDoc.getElementById('gdds_head');
        var he= menuElement.offsetHeight;
        
        if (menuElement) {
          console.log('找到了元素:', menuElement);
        } else {
          console.log('没有找到元素');
        }
      } else {
        console.log('没有找到iframe');
      }
    }, 500);
  },



});
