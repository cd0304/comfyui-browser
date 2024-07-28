import { api } from '../../../scripts/api.js'
import { ComfyWidgets } from '../../../scripts/widgets.js'
import { $el } from '../../../scripts/ui.js'
import { app } from '../../../scripts/app.js'
import { XLSXS } from '/extensions/Poster-generator/lib/xlsx.full.min.js'


// 上传并解析Excel文件
async function uploadAndParseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log(XLSXS, 'reader.onload', e);
      const data = new Uint8Array(e.target.result);
      const workbook = XLSXS.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0]; // 获取第一个工作表名称
      const worksheet = workbook.Sheets[sheetName];
      try {
        const json = XLSXS.utils.sheet_to_json(worksheet, { defval: '' }); // 可以尝试添加defval选项
        if (json && json.length > 0) {
          resolve(json);
        } else {
          console.error('转换后得到的JSON数组为空，可能是由于工作表没有有效数据');
        }
      } catch (error) {
        console.error('在将工作表转换为JSON时发生错误:', error);
        reject(error);
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsArrayBuffer(file); // 以数组缓冲区形式读取文件内容
  });
}




async function uploadExcel(blob, fileType = '.xls', filename) {
  const body = new FormData();
  body.append(
    'file',
    new File([blob], (filename || new Date().getTime()) + fileType)
  );

  // 调用你的后端API
  const resp = await api.fetchApi('/upload/image', {
    method: 'POST',
    body
  });

  let data = await resp.json();
  // 回应中应包含一些上传后的文件信息，如路径或其他识别信息
  let { filepath } = data;
  console.log('filepath', filepath)
  // 可以返回整个data或只是文件的路径
  return filepath;
}

const getLocalData = key => {
  let data = {}
  try {
    data = JSON.parse(localStorage.getItem(key)) || {}
  } catch (error) {
    return {}
  }
  return data
}


function get_position_style(ctx, widget_width, y, node_height) {
  const MARGIN = 4 // the margin around the html element

  /* Create a transform that deals with all the scrolling and zooming */
  const elRect = ctx.canvas.getBoundingClientRect()
  const transform = new DOMMatrix()
    .scaleSelf(
      elRect.width / ctx.canvas.width,
      elRect.height / ctx.canvas.height
    )
    .multiplySelf(ctx.getTransform())
    .translateSelf(MARGIN, MARGIN + y)

  return {
    transformOrigin: '0 0',
    transform: transform,
    left: `0`,
    top: `0`,
    cursor: 'pointer',
    position: 'absolute',
    maxWidth: `${widget_width - MARGIN * 2}px`,
    // maxHeight: `${node_height - MARGIN * 2}px`, // we're assuming we have the whole height of the node
    width: `${widget_width - MARGIN * 2}px`,
    // height: `${node_height * 0.3 - MARGIN * 2}px`,
    // background: '#EEEEEE',
    display: 'flex',
    flexDirection: 'column',
    // alignItems: 'center',
    justifyContent: 'space-around'
  }
}
function createImage(url) {
  let im = new Image()
  return new Promise((res, rej) => {
    im.onload = () => res(im)
    im.src = url
  })
}
app.registerExtension({
  name: 'gdds.excel.upload',
  async getCustomWidgets(app) {
    return {
      EXCEL(node, inputName, inputData, app) {
        console.log('##node', node, inputName, inputData)
        // console.log('##node', node, inputName, inputData)
        const widget = {
          type: inputData[0], // the type, EXCEL
          name: inputName, // the name, slice
          size: [128, 88], // a default size
          draw(ctx, node, width, y) { },
          computeSize(...args) {
            return [128, 88] // a method to compute the current size of the widget
          },
          async serializeValue(nodeId, widgetIndex) {
            console.log("serializeValue", nodeId, widgetIndex)
            // let d = getLocalData('_mixlab_svg_image')
            // console.log('serializeValue', d)
            // if (d) {
            //   let url = d[node.id]
            //   let dt = await fetch(url)
            //   let svgStr = await dt.text()
            //   const { data, image } = (await parseSvg(svgStr)) || {}
            //   // console.log(data, image)
            //   return JSON.parse(JSON.stringify({ data, image }))
            // } else {
            //   return
            // }
          }
        }

        // console.log('##node',node.serialize)
        //  widget.something = something;          // maybe adds stuff to it
        node.addCustomWidget(widget) // adds it to the node

        return widget // and returns it.
      }
    }
  },

  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    console.log("beforeRegisterNodeDef", nodeType.comfyClass)
    // if (nodeType.comfyClass == 'ReadExcelNode') {
    if (nodeType.comfyClass == 'ReadExcelNode') {
      const orig_nodeCreated = nodeType.prototype.onNodeCreated
      nodeType.prototype.onNodeCreated = async function () {

        console.log('beforeRegisterNodeDef', nodeType.comfyClass)
        orig_nodeCreated?.apply(this, arguments)
        const uploadWidget = this.widgets.filter(w => w.name == 'upload')[0]
        console.log('SvgImage nodeData', this.widgets)
        const widget = {
          type: 'div',
          name: 'upload-preview',
          draw(ctx, node, widget_width, y, widget_height) {
            Object.assign(
              this.div.style,
              get_position_style(ctx, widget_width, 44, node.size[1])
            )
          }
        }

        widget.div = $el('div', {})

        document.body.appendChild(widget.div)

        const inputDiv = (key, placeholder, container) => {
          let div = document.createElement('div')
          const ip = document.createElement('input')
          ip.type = 'file'
          ip.className = `${'comfy-multiline-input'} ${placeholder}`
          div.style = `display: flex;
          align-items: center; 
          margin: 6px 8px;
          margin-top: 0;`
          ip.placeholder = "placeholder"
          // ip.value = value

          ip.style = `outline: none;
          border: none;
          padding: 4px;
          width: 60%;cursor: pointer;
          height: 32px;`
          const label = document.createElement('label')
          label.style = 'font-size: 10px;min-width:32px'
          label.innerText = placeholder
          div.appendChild(label)
          div.appendChild(ip)

          let that = this

          ip.addEventListener('change', event => {
            console.log('change')
            const file = event.target.files[0]
            uploadAndParseExcel(file).then((jsonData) => {
              const table = document.createElement('table');
              table.className = 'comfy-data-table'; // 根据你的UI库定制样式
              table.style.backgroundColor = 'black'; // 添加背景颜色为黑色

              // 定义所需的表头字段
              const requiredFields = ['序列','文案', '人物IP']; // 替换为实际需要的字段名

              // 创建表头
              const thead = document.createElement('thead');
              const headerRow = document.createElement('tr');
              requiredFields.forEach(field => {
                if (jsonData[0].hasOwnProperty(field)) { // 只有当jsonData[0]中存在该字段时才添加表头
                  const th = document.createElement('th');
                  th.textContent = field;
                  headerRow.appendChild(th);
                }
              });
              thead.appendChild(headerRow);
              table.appendChild(thead);

              // 创建表格主体部分
              const tbody = document.createElement('tbody');
              jsonData.forEach(item => {
                const row = document.createElement('tr');
                requiredFields.forEach(field => {
                  if (item.hasOwnProperty(field)) { // 只有当item中存在该字段时才添加单元格
                    const td = document.createElement('td');
                    td.textContent = item[field];
                    row.appendChild(td);
                  }
                });
                tbody.appendChild(row);
              });
              table.appendChild(tbody);

              // 将整个表格添加到文档中
              // const container = document.getElementById('your-container-id'); // 替换为你的容器ID
              container.appendChild(table);
              // 添加内联样式或在head中插入一个style元素来改变边框颜色
              const styleElement = document.createElement('style');
              styleElement.textContent = `.comfy-data-table, .comfy-data-table th, .comfy-data-table td {border: 1px solid green;}`;
              document.head.appendChild(styleElement);
            }).catch((error) => {
              console.error('解析Excel文件时出错:', error);
            });
          })
          return div
        }

        let svg = document.createElement('div')
        svg.className = 'preview'
        svg.style = `background:#eee;margin-top: 12px;`
        svg.style.backgroundColor = 'black'; // 添加背景颜色为黑色

        let upload = inputDiv('_mixlab_svg_image', 'EXCEL2', svg)

        widget.div.appendChild(upload)
        widget.div.appendChild(svg)
        this.addCustomWidget(widget)

        const onRemoved = this.onRemoved
        this.onRemoved = () => {
          upload.remove()
          svg.remove()
          widget.div.remove()
          return onRemoved?.()
        }

        if (this.onResize) {
          this.onResize(this.size)
        }

        this.serialize_widgets = true //需要保存参数
      }
    };
    // };


  },
  async loadedGraphNode(node, app) {
    console.log('loadedGraphNode', node)
    // Fires every time a node is constructed
    // You can modify widgets/add handlers/etc here

  }
})