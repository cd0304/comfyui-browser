<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let comfyUrl: string;

  // let initialLoad = true;

  function generateUniqueId() {
    // 使用时间戳加上一定数量的随机数以增加唯一性
    return `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  }
  let listData = [];

  // let options = [
  //   { value: 'option1', label: '尺1', isSelected: false },
  //   { value: 'option2', label: '尺2', isSelected: false },
  //   { value: 'option3', label: '尺3', isSelected: false },
  //   { value: 'option4', label: '尺4', isSelected: false },
  //   { value: 'option5', label: '尺5', isSelected: false },
  //   { value: 'option6', label: '尺6', isSelected: false },
  //   // 更多选项...
  // ];
  // 更新选中项的方法
  function updateSelectedOptions(rowIndex, optionValue, isChecked) {
    const row = listData[rowIndex];
    if (isChecked) {
      if (!row.sizes) {
        row.sizes = [optionValue];
      } else {
        row.sizes.push(optionValue);
      }
    } else {
      row.sizes = row.sizes.filter((value) => value !== optionValue);
    }
  }
  function toggleCheckbox(event, index) {
    listData[index].isSelected = event.target.checked;
  }
  let newItem = {
    id: generateUniqueId(),
    text: '',
    ip: '',
    title: '',
    material1: '',
    material2: '',
    material3: '',
    url: '',
    sizes: '',
    action: 'batch',
  };

  function addItem() {
    const newid = generateUniqueId();
    listData = [...listData, newItem];
    newItem = {
      id: generateUniqueId(),
      text: '',
      ip: '',
      title: '',
      material1: '',
      material2: '',
      material3: '',
      url: '',
      sizes: '',
      action: 'batch',
    };
  }
  function clearItem() {
    listData = [];
    localStorage.setItem('listData', JSON.stringify([]));
  }
  function handleFileSelect(event, materialField, index) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      listData[index][materialField] = imageUrl;
    }
  }

  function handleClick(inputElement, index) {
    inputElement.click();
  }

  function preventDefault(node) {
    node.addEventListener('click', (event) => {
      event.preventDefault();
    });
  }

  // let inputs = [];
  // $: {
  //   inputs = listData.map((_, index) => ({
  //     id: `upload-image-${index}`,
  //     bindThis: (element) => preventDefault(element),
  //   }));
  // }
  // 初始化时添加一条记录
  onMount(() => {
    // addItem();
    // switchToTab('norun');
    window.top?.dispatchEvent(new CustomEvent('setBrowserSize', { detail: 1 }));
    const storedListData = localStorage.getItem('listData');
    console.log('initialLoad', storedListData);
    if (storedListData) {
      listData = JSON.parse(storedListData);
    } else {
      // 如果没有存储的数据或首次加载，则添加默认项
      addItem();
    }
    // initialLoad = false;
  });
  onDestroy(() => {
    // 保存数据
    console.log(2, listData);
    localStorage.setItem('listData', JSON.stringify(listData));
  });
</script>

<div class="buttion_top_container">
  <div class="button-container">
    <button class="left-button add-button" on:click={addItem}>新增</button>
    <div class="right-button">
      <button class="red-button" on:click={clearItem}>清空</button>
      <button class="green-button" on:click={addItem}>执行</button>
    </div>
  </div>
</div>
<div class="table">
  <!-- 添加表头 -->
  <div class="table-row">
    <div class="table-cell">ID</div>
    <div class="table-cell width-custom1">文案</div>
    <div class="table-cell width-custom2">标题</div>
    <div class="table-cell">角色IP</div>
    <div class="table-cell">IP素材(可选)</div>
    <div class="table-cell">画面素材(可选)</div>
    <div class="table-cell">其他素材(可选)</div>
    <div class="table-cell">网址(可选)</div>
    <div class="table-cell">尺寸</div>
    <div class="table-cell">批量</div>
  </div>

  {#each listData as item, index (item.id)}
    <div class="table-row">
      <!-- 对于ID字段，通常我们不希望它是可编辑的 -->
      <div class="table-cell">{item.id}</div>
      <!-- 其他字段变为可编辑并设置宽度 -->
      <div class="table-cell">
        <textarea rows="4" bind:value={item.text} placeholder="例如：两只黄色毛发的熊，熊大与熊二，熊大在说谎"/>
      </div>
      <div class="table-cell">
        <textarea rows="4" bind:value={item.title} placeholder="例如：熊大谎话连篇，因此成就了名场面"/>
      </div>
      <div class="table-cell">
        <textarea rows="4" bind:value={item.ip} placeholder="例如：熊大"/>
      </div>
      <div class="table-cell">
        <input
          type="file"
          id={`upload-image1-${index}`}
          accept="image/*"
          on:change={(event) => handleFileSelect(event, 'material1', index)}
          style="display: none;"
        />
        <label for={`upload-image1-${index}`}>
          {#if item.material1}
            <img src={item.material1} alt="Uploaded image" />
          {:else}
            选择图片
          {/if}
        </label>
      </div>
      <div class="table-cell">
        <input
          type="file"
          id={`upload-image2-${index}`}
          accept="image/*"
          on:change={(event) => handleFileSelect(event, 'material2', index)}
          style="display: none;"
        />
        <label for={`upload-image2-${index}`}>
          {#if item.material2}
            <img src={item.material2} alt="Uploaded image" />
          {:else}
            选择图片
          {/if}
        </label>
      </div>
      <div class="table-cell">
        <input
          type="file"
          id={`upload-image3-${index}`}
          accept="image/*"
          on:change={(event) => handleFileSelect(event, 'material3', index)}
          style="display: none;"
        />
        <label for={`upload-image3-${index}`}>
          {#if item.material3}
            <img src={item.material3} alt="Uploaded image" />
          {:else}
            选择图片
          {/if}
        </label>
      </div>
      <div class="table-cell">
        <textarea rows="4"  bind:value={item.url} placeholder="例如：https://www.ixigua.com/6545322534089261582?logTag=dea5ab5e9387dd792fd2"/>
      </div>
      <div class="table-cell width-custom2">
        <textarea rows="4" bind:value={item.sizes} placeholder="支持多个尺寸，用分号隔开，例如：512*512; 356*450; 356*450" />
      </div>

      <div class="table-cell button-cell">
        <input
          type="checkbox"
          bind:checked={item.isSelected}
          on:change={(event) => toggleCheckbox(event, index)}
        />
        <!-- <label>选择</label> -->
      </div>
    </div>
  {/each}
</div>

<style>
  .table {
    display: table;
    width: 100%;
    border-collapse: collapse;
  }

  .table-row {
    display: table-row;
  }

  .table-cell {
    display: table-cell;
    padding: 2px;
    border: 1px solid #ccc;
    text-align: left;
  }

  .buttion_top_container {
    display: flex;
    flex-direction: column;
    /* justify-content: space-between; */
    align-items: stretch;
    width: 100%;
    padding: 5px;
    box-sizing: border-box;
  }
  .button-container {
    width: 100%;
    display: flex;
    justify-content: space-between; /* 使按钮两端对齐 */
    /* margin-bottom: 10px;  */
    /* margin-left: 10px;  */
  }

  .left-button {
    margin-right: auto; /* 将左边的按钮推到最左侧 */
    margin-left: 20px;
    /* padding: 5px; */
  }

  .right-button {
    /* 默认情况下，右边的按钮会自动靠右 */
    /* padding: 5px; */
    margin-left: auto;
    margin-right: 30px;
  }
  .red-button {
    background-color: red;
    color: white; /* 更改字体颜色以提高对比度 */
    border: none;
    padding: 8px 16px;
    cursor: pointer;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    margin-right: 18px; /* 如果需要与其他按钮间隔开 */
  }
  .add-button {
    background-color: #4caf50; /* 设置为绿色背景 */
    color: white;
    padding: 10px 10px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    outline: none;
  }
  .green-button {
    background-color: #4caf50; /* 设置为绿色背景 */
    color: white;
    padding: 10px 10px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    outline: none;
  }
  
  .table-cell input {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 2px; /* 根据需要添加内边距 */
  }

  .table-cell textarea {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 2px; /* 根据需要添加内边距 */
  }
  .table-cell.width-custom1 {
    width: 20%; /* 设置宽度为父容器的30% */
  }
  .table-cell.width-custom2 {
    width: 12%; /* 设置宽度为父容器的30% */
  }

  .table-cell label {
    display: inline-block;
    padding: 0.2em 0.4em;
    margin: 0;
    border: 1px solid #ccc;
    border-radius: 0.2em;
    background-color: #f8f8f8;
    cursor: pointer;
    align-items: top;
  }

  .table-cell label:hover {
    background-color: #e8e8e8;
  }
  .table-cell img {
    width: 100px;
    height: 100px;
  }
  .table-cell input[type='checkbox'] {
    vertical-align: top;
  }

  .table-cell input[type='checkbox'] + label {
    cursor: pointer;
    margin-left: 0.5em;
  }
  .options {
    vertical-align: top;
  }
</style>
