<template>
  <div>
    <div class="operate-title"><span class="prefix">❯</span>组件调用</div>
    <div>
      <div class="button" @click="openNewRecord">新建记录</div>
      <div class="button" @click="openRecordInfo">打开记录</div>
      <div class="button" @click="selectRecord">选择记录</div>
    </div>
    <div>
      <div class="button" @click="selectUsers">选择人员</div>
      <div class="button" @click="selectDepartment">选择部门</div>
      <div class="button" @click="selectOrgRole">选择组织角色</div>
      <div class="button" @click="selectLocation">选择地图定位</div>
    </div>
  </div>
</template>

<script setup>
import { utils, config } from "mdye";
const props = defineProps(["addLog"]);
const { addLog } = props;
const { appId, worksheetId } = config;

function openNewRecord() {
  utils
    .openNewRecord({
      worksheetId,
    })
    .then((row) => {
      addLog("创建成功，新纪录 id 是" + row.rowid);
    });
}
function openRecordInfo() {
  utils
    .selectRecord({
      relateSheetId: worksheetId,
    })
    .then((records) => {
      utils
        .openRecordInfo({
          appId,
          worksheetId,
          recordId: records[0].rowid,
        })
        .then((updatedRow) => {
          console.log({ updatedRow });
        });
    });
}
function selectRecord() {
  utils
    .selectRecord({
      relateSheetId: worksheetId,
      multiple: true,
    })
    .then((records) => {
      addLog("已选择记录 " + records.map((r) => r.rowid));
    });
}
async function selectUsers() {
  addLog("打开选择人员弹窗");
  const users = await utils.selectUsers();
  console.log(users);
  addLog("已选择人员 " + users.map((u) => u.fullname));
}
function selectDepartment() {
  addLog("打开选择部门弹窗");
  utils.selectDepartments().then((departments) => {
    addLog("已选择部门 " + departments.map((d) => d.departmentName));
  });
}
function selectOrgRole() {
  addLog("打开选择组织角色弹窗");
  utils.selectOrgRole().then((orgs) => {
    addLog("已选择组织角色 " + orgs.map((o) => o.organizeName));
  });
}
function selectLocation() {
  addLog("打开选择选择地图定位弹窗");
  utils
    .selectLocation({
      closeAfterSelect: true,
    })
    .then((location) => {
      console.log(location);
      addLog("已选择地图定位 " + (location.name || location.address));
    });
}
</script>
