<template>
  <div class="block mt10 log">
    <div class="content">
      <div class="base">~/mingdao.com/mdye</div>
      <div class="log-list">
        <div class="log-item" v-for="(log, index) in logs" :key="index">
          <span class="time">{{ log.timeStr }}</span>
          {{ log.content }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(["logs"]);
const { logs } = props;
</script>
