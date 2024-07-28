<script lang="ts">
  import Navbar from './Navbar.svelte';
  import FilesTab from './FilesTab.svelte';
  import InputsTab from './InputsTab.svelte';
  import CollectionsTab from './CollectionsTab.svelte';
  import SourcesTab from './SourcesTab.svelte';
  import ModelsTab from './ModelsTab.svelte';
  import { getLocalConfig } from './utils';
  import { onMount } from 'svelte';


  export let data: any;
  const { comfyUrl } = data;

  let activeTab = 'run';
  onMount(() => {
    const config = getLocalConfig();
    if (config.lastTab) {
      activeTab = config.lastTab;
    }
    window.top.addEventListener("switchTabToRun", (event) => {
      activeTab = "run"
    });
  });
</script>

<Navbar bind:activeTab />

{#if activeTab === 'inputs'}
  <InputsTab {comfyUrl} />
{:else if activeTab === 'run'}
  <script lang="ts">
    window.top?.dispatchEvent(new CustomEvent('setBrowserSize', { detail: 0 }));
  </script>
{:else if activeTab === 'collections'}
  <CollectionsTab {comfyUrl} />
{:else if activeTab === 'sources'}
  <SourcesTab {comfyUrl} />
{:else if activeTab === 'models'}
  <ModelsTab {comfyUrl} />
{:else}
  <FilesTab {comfyUrl} />
{/if}
