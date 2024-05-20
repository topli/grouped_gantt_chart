<template></template>

<script setup>
import { ref, onMounted } from "vue";
import { config, env, api } from "mdye";
const { appId, worksheetId, viewId, controls } = config;
const { getFilterRowsTotalNum, getFilterRows } = api;

onMounted(async () => {
  const { countNum, dataRows, showFields } = await getDatas();
});

const getDatas = async () => {
  const { filters } = config;
  const pageSize = 100;
  const dataRows = {};
  const get_group_name_datas = {};
  get_group_name_datas[11] = (group_value) => {
    for (const iterator of group_value.options) {
      dataRows[iterator.value] = [];
    }
    dataRows["空"] = [];
    return group_value.options;
  };
  const group_id = env.group[0];
  const group_value = controls.find((item) => item.controlId === group_id);
  const group_names = get_group_name_datas[group_value.type](group_value);
  const params = {
    worksheetId,
    viewId,
    pageSize,
    ...filters,
  };
  const countNum = await getFilterRowsTotalNum(params);
  const pageCount = Math.ceil(countNum / pageSize);
  for (let pageIndex = 1; pageIndex <= pageCount; pageIndex++) {
    params.pageIndex = pageIndex;
    const rows = await getFilterRows(params);
    rows.data.map((row) => {
      const groupData = group_names.find(
        (item) => item.key == JSON.parse(row[group_id])[0]
      );
      const groupName = groupData ? groupData.value : "空";
      const class_type = row[env.class_type];
      if (class_type in dataRows[groupName]) {
        dataRows[groupName][class_type].push(row);
      } else {
        dataRows[groupName][class_type] = [];
        dataRows[groupName][class_type].push(row);
      }
    });
  }
  const showFields = env.showFields.map((item) => {
    return controls.find((control) => control.controlId === item);
  });
  console.log({ countNum, dataRows, showFields });
  return {
    countNum,
    dataRows,
    showFields,
  };
};
</script>

<style></style>
