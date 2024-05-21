import React, {
  useEffect,
  useState,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import { Pagination } from 'antd';
import { env, config, api, utils, md_emitter } from "mdye";
import styled from "styled-components";
import { gantt } from "dhtmlx-gantt";
import "dhtmlx-gantt/codebase/dhtmlxgantt.css";

const Con = styled.div`
  overflow-y: auto;
  height: auto;
  background: #fff;
  display: flex;
  flex-direction: column;
  .mt10 {
    margin-top: 10px;
  }
  > div {
    box-sizing: border-box;
  }
  .brand {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    .logo {
      position: relative;
      img {
        position: relative;
        width: 200px;
        z-index: 1;
      }
    }
    .hello {
      margin-top: 20px;
      font-family: Verdana;
      font-weight: bold;
      font-size: 50px;
      color: #444;
    }
    .edit {
      margin-top: 10px;
      font-size: 16px;
      color: #888;
    }
    .records-count {
      margin-top: 10px;
      font-size: 16px;
      color: #666;
    }
  }
  .playground {
    flex: 1;
    max-width: 600px;
    overflow-x: hidden;
    overflow-y: auto;
    .con {
      padding: 20px 40px;
    }
    .block {
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid rgba(188, 209, 228, 0.44);
      margin-bottom: 12px;
      .header {
        color: #666;
        padding-left: 14px;
        font-size: 13px;
        height: 32px;
        line-height: 32px;
        border-bottom: 1px solid rgba(188, 209, 228, 0.44);
      }
      .content {
        font-size: 13px;
        padding: 10px 18px;
        white-space: pre;
        color: #50a14f;
        line-height: 1.3em;
      }
    }
    .operate-title {
      margin: -4px 0 4px;
      font-weight: bold;
      color: #555;
      .prefix {
        color: #00a1ff;
        margin-right: 5px;
      }
    }
    .button {
      margin: 6px 6px 0 0;
      font-size: 13px;
      display: inline-block;
      border: 1px solid #bcd1e4;
      border-radius: 4px;
      height: 32px;
      line-height: 30px;
      padding: 0 16px;
      color: #5d6f7e;
      cursor: pointer;
      user-select: none;
      &:hover {
        background: #fafafa;
      }
    }
    .log {
      font-size: 14px;
      max-height: 200px;
      overflow-y: auto;
      .base {
        color: #0451a5;
      }
      .log-item {
        white-space: break-spaces;
        color: #555;
        line-height: 1.3em;
        .time {
          margin-right: 5px;
          color: #307c58;
        }
      }
    }
  }
  @media (max-width: 1000px) {
    flex-direction: column;
    overflow-y: auto;
    height: auto;
    .brand {
      flex: none;
      padding: 100px 0;
    }
    .playground {
      flex: none;
      max-width: none;
    }
  }
  .top-wrapper {
    .scales {
      display: flex;
      padding: 8px;
      .button {
        font-size: 14px;
        border: 1px solid #eee;
        padding: 4px 6px;
        line-height: 1;
        border-radius: 2px;
        cursor: pointer;
        &:hover,
        &.is-active {
          color: #fff;
          background-color: #2196f3;
        }
        &:not(last-child) {
          margin-right: 8px;
        }
      }
    }
  }
  .gantt-container {
    width: 100%;
    height: calc(100vh - 100px);
  }
  .gantt_task_line {
    border-radius: 5px;
    border: none;
  }
  .is-parent {
    opacity: 1;
  }
  .gantt_side_content.gantt_right {
    color: black;
  }
  .is-milestone {
    width: 0;
    height: 0;
    border-left: 5px solid transparent; /* 左侧三角形 */
    border-right: 5px solid transparent; /* 右侧三角形 */
    border-top: 10px solid rgb(255 69 0 / 90%); /* 倒三角 */
    border-radius: 0px;
    transform: translateY(-22px);
  }
  .gantt_tree_content {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .gantt_task_line.gantt_milestone .gantt_task_content {
    background-color: #00000000;
    border-width: 7px;
    transform: rotate(0deg);
    transform: translateX(-9px);
  }

  .gantt-page {
    padding: 10px;
  }
`;

export default function () {
  const { appId, worksheetId, viewId, projectId } = config;
  const { getFilterRows, getFilterRowsTotalNum, updateWorksheetRow } = api;
  const logRef = useRef();
  const [count, setCount] = useState();
  const milestoneColor = "rgb(255 69 0 / 90%)";
  const [logs, setLogs] = useState([
    { time: new Date(), content: "hello world!" },
  ]);

  const [pageIndex, setPageIndex] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [total, setTotal] = useState(0)

  const getDatas = async () => {
    const list = []
    const { filters } = config;
    const pageSize = 100;
    const dataRows = {};
    const getGroupValue = async (controlId, value, dataType) => {
      return {
        spliceType: 1,
        isGroup: true,
        groupFilters: [
          {
            controlId: controlId,
            dataType: dataType,
            spliceType: 1,
            filterType: 51,
            dynamicSource: [],
            values: [value],
          },
        ],
      };
    };
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

    console.log(group_names);
    group_names.forEach((item) => {
      list.push({
        id: item.value,
        type: 'project',
        // render: 'split',
        name: item.value,
        color: "rgba(0,0,0,0)",
        text: "",
        parent: 0,
        ...item
      })
    })

    const isExist = []
    for (let pageIndex = 1; pageIndex <= pageCount; pageIndex++) {
      params.pageIndex = pageIndex;
      const rows = await getFilterRows(params);
      rows.data.forEach((row) => {
        const groupData = group_names.find(
          (item) => item.key == JSON.parse(row[group_id])[0]
        );
        const class_type = row[env.class_type];
        if (isExist.includes(groupData.value + class_type)) {
          list.push({
            id: row._id,
            parent: groupData.value + class_type,
            text: "",
            color: "rgb(0 3 250 / 50%)",
            start_date: row['664adae2606f723660cce366'] || null,
            end_date: row['664adae2606f723660cce367'] || null,
            ...row,
          })
        } else {
          isExist.push(groupData.value + class_type)
          list.push({
            id: groupData.value + class_type,
            type: 'project',
            render: "split",
            parent: groupData.value,
            text: "",
            color: "rgba(0,0,0,0)",
            ...row,
          })
          list.push({
            id: row._id,
            parent: groupData.value + class_type,
            text: "",
            color: "rgb(21 255 117 / 50%)",
            start_date: row['664adae2606f723660cce366'] || null,
            end_date: row['664adae2606f723660cce368'] || null,
            ...row,
          })
        }
      })
    }
    console.log(list);
    const showFields = env.showFields.map((item) => {
      return controls.find((control) => control.controlId === item);
    });
    return {
      countNum,
      dataRows,
      showFields,
      list
    };
  };

  const addTime = (time, h = 23) => {
    const newTime = new Date(time);
    newTime.setHours(h);
    newTime.setMinutes(59);
    newTime.setSeconds(59);
    return new Date(newTime);
  };
  // 需要过滤标头的key
  const columnsFilterKeys = [
    "startTime1",
    "endTime1",
    "startTime2",
    "endTime2",
    "milestone",
    "milestone_info",
  ];
  // 任务中的需要显示的时间key
  let taskKeys = {
    startTime1: "",
    endTime1: "",
    startTime2: "",
    endTime2: "",
    name: "",
    milestone: "",
    milestone_info: "",
  };

  const controlsMap = new Map();

  const { controls, filters } = config;
  // 构建字段map
  for (let i = 0; i < controls.length; i++) {
    const con = controls[i];
    controlsMap.set(con.controlId, con);
  }
  const keys = Object.keys(env);
  const new_env = {};
  for (let i = 0; i < keys.length; i++) {
    const item = env[keys[i]];
    if (item) {
      new_env[keys[i]] = controlsMap.get(item[0]);
    }
  }
  const newline = (str, num = 30) => {
    let s = "";
    if (str.length > num) {
      const i = Math.ceil(str.length / num);
      for (let n = 0; n < i; n++) {
        const newstr = str.substring(n * num, (n + 1) * num);
        s += `${newstr}<br>`;
      }
      return s;
    } else {
      return str;
    }
  };

  const handleList = (list, parentId = 0, level = 0) => {
    const getLevel = function (level) {
      if (level === 0) return 'project'
      if (level === 1) return 'split'
      return null
    }

    const newList = []
    const dataKeys = Object.keys(list)
    for (let i = 0; i < dataKeys.length; i++) {
      const key = dataKeys[i]
      const data = list[key]
      console.log('key', key);
      console.log('data', Object.prototype.toString.call(data));
      if (Object.prototype.toString.call(data) === '[object Object]') {
        // newList.push({
        //   id: data._id,
        //   render: getLevel(level),
        //   text: "",
        //   color: "rgb(0 3 250 / 50%)",
        //   parent: parentId,
        //   name: key,
        // })
        // handleList(data, data.id, ++level)
      }
    }
    return newList
  }

  const getData = async (pages) => {
    
    const {
      countNum,
      dataRows,
      showFields,
      list
    } = await getDatas();
    setTotal(countNum)
    let columns = [];

    Object.keys(taskKeys).forEach((k) => {
      taskKeys[k] = new_env[k];
    });

    columns = Object.keys(new_env)
      .filter((k) => !columnsFilterKeys.includes(k))
      .map((k, i) => {
        const item = new_env[k];
        return {
          name: item.controlId,
          label: item.controlName,
          tree: i === 0 ? true : false,
          type: item.type,
          options: item.options,
          align: "center",
          // template: function (i) {
          //   console.log(i);
          //   return `<span title="${i.value || ""}">${
          //     i.value || ""
          //   }</span>`;
          // },
        };
      });
    return {
      columns,
      list,
    };
  };
  let ganttList = [];
  const [setFilters] = useState(config);
  const handleFiltersUpdate = useCallback((newFilers) => {
    config.filters = newFilers;
    window.location.reload();
  }, []);
  md_emitter.on("filters-update", handleFiltersUpdate);


  let todayMarker = null
  let intervalIns = null
  const initTodayMarker = () => {
    todayMarker = gantt.addMarker({
      start_date: new Date(),
      css: "today",
    });
    if (intervalIns) clearInterval(intervalIns)
    intervalIns = setInterval(() =>{
      var today = gantt.getMarker(todayMarker);
      if (!today) {
        clearInterval(intervalIns)
        return
      }
      today.start_date = new Date();
      gantt.updateMarker(todayMarker);
    }, 1000 * 5);
  }

  const initGantt = async (pages) => {
    const { columns, list } = await getData(pages);
    // ganttList = list;
    var zoomConfig = {
      levels: [
        {
          name: "day",
          step: 10,
          scale_height: 50,
          min_column_width: 40,
          scales: [
            { unit: "month", format: "%Y %M" },
            { unit: "day", step: 1, format: "%d" },
          ],
        },
        {
          name: "week",
          scale_height: 50,
          min_column_width: 50,
          scales: [
            { unit: "month", format: "%Y %M" },
            {
              unit: "week",
              step: 1,
              format: function (date) {
                var dateToStr = gantt.date.date_to_str("%d");
                var endDate = gantt.date.add(date, -6, "day");
                var weekNum = gantt.date.date_to_str("%W")(date);
                return (
                  weekNum +
                  "周 " +
                  dateToStr(endDate) +
                  "日 - " +
                  dateToStr(date) +
                  "日"
                );
              },
            },
          ],
        },
        {
          name: "month",
          scale_height: 50,
          min_column_width: 120,
          scales: [
            { unit: "year", step: 1, format: "%Y" },
            { unit: "month", format: "%M" },
          ],
        },
        {
          name: "quarter",
          height: 50,
          min_column_width: 90,
          scales: [
            { unit: "year", step: 1, format: "%Y" },
            {
              unit: "quarter",
              step: 1,
              format: function (date) {
                var dateToStr = gantt.date.date_to_str("%M");
                var endDate = gantt.date.add(
                  gantt.date.add(date, 3, "month"),
                  -1,
                  "day"
                );
                return dateToStr(date) + " - " + dateToStr(endDate);
              },
            },
          ],
        },
        {
          name: "year",
          scale_height: 50,
          min_column_width: 30,
          scales: [{ unit: "year", step: 1, format: "%Y" }],
        },
      ],
    };
    gantt.plugins({
      marker: true,
    });
    gantt.clearAll();
    gantt.ext.zoom.init(zoomConfig);
    gantt.ext.zoom.setLevel("day");

    gantt.config.grid_width = 350
    gantt.config.add_column = false; //添加符号
    // gantt.config.autosize = true//自适应尺寸
    gantt.config.autofit = true// 表格列宽自适应
    gantt.config.autoscroll = true; // 把任务或者连线拖拽到浏览器屏幕外时，自动触发滚动效果
    gantt.config.drag_progress = true; //取消任务进度条进度拖动
    gantt.config.scale_height = 40;
    gantt.config.row_height = 50;
    gantt.config.bar_height = 22;
    gantt.config.fit_tasks = true; //自动延长时间刻度，以适应所有显示的任务
    gantt.config.auto_types = true; //将包含子任务的任务转换为项目，将没有子任务的项目转换回任务
    gantt.config.show_errors = false;
    gantt.i18n.setLocale("cn"); //设置语言
    //时间栏配置
    gantt.config.show_progress = false;
    gantt.config.xml_date = "%Y-%m-%d %H:%i";
    gantt.config.start_date = new Date();

    gantt.config.show_tasks_outside_timescale = true;
    gantt.config.drag_links = false; // 禁用链接(禁用连线关联)

    gantt.config.layout = {
      css: "gantt_container",
      cols: [
        {
          width: 350,
          min_width: 200,
          rows: [
            {
              view: "grid",
              scrollX: "gridScroll",
              scrollable: true,
              scrollY: "scrollVer",
            },
            { view: "scrollbar", id: "gridScroll", group: "horizontal" },
          ],
        },
        { resizer: true, width: 1 },
        {
          rows: [
            { view: "timeline", scrollX: "scrollHor", scrollY: "scrollVer" },
            { view: "scrollbar", id: "scrollHor", group: "horizontal" },
          ],
        },
        { view: "scrollbar", id: "scrollVer" },
      ],
    };

    initTodayMarker()

    //鼠标移入展示信息
    gantt.plugins({
      tooltip: true,
    });

    //时间展示 2021-10-11 07:22
    gantt.templates.tooltip_date_format =
      gantt.date.date_to_str("%Y-%m-%d %H:%i");

    gantt.templates.task_class = (start, end, task) => {
      // if (task.render === "split") {
      //   return `is-parent`;
      // }
      // if (task.customType == "milestone") {
      //   return `is-milestone`;
      // }
    };
    gantt.templates.rightside_text = (start, end, task) => {
      // if (task.render === "split") {
      //   let style = `white-space: nowrap; overflow: hidden;text-overflow: ellipsis;max-width: 120px;display: inline-block;`;
      //   return `<span style="${style}">${
      //     task[taskKeys.name.controlId] || ""
      //   }</span>`;
      // }
    };
    gantt.templates.tooltip_text = (start, end, task) => {
      // console.log(task);
      // if (task.type == "project") {
      //   return false;
      // }
      // const format = (date) => {
      //   if (date) return gantt.date.date_to_str("%m/%d %H:%i")(date);
      //   return "";
      // };
      // const format_date = (date) => {
      //   if (date) return gantt.date.date_to_str("%Y/%m/%d")(date);
      //   return "";
      // };

      // const name = task[taskKeys.name.controlId] || "";
      // const expect_start = task[taskKeys.startTime1.controlId]
      //   ? new Date(
      //       task[taskKeys.startTime1.controlId].length > 10
      //         ? task[taskKeys.startTime1.controlId]
      //         : task[taskKeys.startTime1.controlId] + " 00:00:00"
      //     )
      //   : null;
      // const expect_end = task[taskKeys.endTime1.controlId]
      //   ? new Date(
      //       task[taskKeys.endTime1.controlId].length > 10
      //         ? task[taskKeys.endTime1.controlId]
      //         : task[taskKeys.endTime1.controlId] + " 23:59:59"
      //     )
      //   : null;
      // const real_start = task[taskKeys.startTime2.controlId]
      //   ? new Date(
      //       task[taskKeys.startTime2.controlId].length > 10
      //         ? task[taskKeys.startTime2.controlId]
      //         : task[taskKeys.startTime2.controlId] + " 00:00:00"
      //     )
      //   : null;
      // const real_end = task[taskKeys.endTime2.controlId]
      //   ? new Date(
      //       task[taskKeys.endTime2.controlId].length > 10
      //         ? task[taskKeys.endTime2.controlId]
      //         : task[taskKeys.endTime2.controlId] + " 23:59:59"
      //     )
      //   : null;
      // const milestone = task[taskKeys.milestone.controlId]
      //   ? new Date(
      //       task[taskKeys.milestone.controlId].length > 10
      //         ? task[taskKeys.milestone.controlId]
      //         : task[taskKeys.milestone.controlId] + " 00:00:00"
      //     )
      //   : null;
      // const milestone_info = task[taskKeys.milestone_info.controlId] || "";
      // let realDate = ``;
      // let expectDate = ``;
      // let milestoneDate = ``;

      // let style = `width: 6px;height: 6px;display: inline-block;border-radius: 50%;margin-right: 10px;`;
      // realDate = `<div><i style="${
      //   style + "background: rgb(0 3 250 / 50%);"
      // }"></i><span>${taskKeys.startTime1.controlName}:${format(
      //   expect_start
      // )}</span> - <span>${taskKeys.endTime1.controlName}:${format(
      //   expect_end
      // )}</span></div>`;
      // expectDate = `<div><i style="${
      //   style + "background: rgb(21 255 117 / 50%);"
      // }"></i><span>${taskKeys.startTime2.controlName}:${format(
      //   real_start
      // )}</span> - <span>${taskKeys.endTime2.controlName}:${format(
      //   real_end
      // )}</span></div>`;
      // if (task.customType == "milestone") {
      //   milestoneDate = `<div><div><span>里程碑</span></div><div><i style="${
      //     style + "background:" + milestoneColor + ";"
      //   }"></i><span>${taskKeys.milestone.controlName}:${format_date(
      //     milestone
      //   )}</span></div><div ><i style="${
      //     style + "background:" + milestoneColor + ";"
      //   }"></i><span>${taskKeys.milestone_info.controlName}:${newline(
      //     milestone_info,
      //     30
      //   )}</span></div></div>`;
      // }
      // let nameStyle = `white-space: nowrap; overflow: hidden;text-overflow: ellipsis;max-width: 120px;display: inline-block;`;
      // return `<div>
      //   <div style="display: flex;width: max-content;"><span>${taskKeys.name.controlName}:</span><span style="${nameStyle}">${name}</span></div>
      //   ${realDate}
      //   ${expectDate}
      //   ${milestoneDate}
      // </div>`;
    };

    gantt.attachEvent("onTaskClick", function (id, e) {
      const target = e.target
      if (Array.from(target.classList).includes('gantt_tree_icon')) {
        return true
      }
      const find = list.find((item) => item.id === id);
      utils.openRecordInfo({
        appId,
        worksheetId,
        viewId,
        recordId: find.rowid,
      });
      //any custom logic here
      return true;
    });
    //鼠标移入展示信息
    gantt.config.readonly = true //甘蔗图只读属性
    // gantt.config.round_dnd_dates = false //将任务开始时间和结束时间自动“四舍五入'
    // gantt.config.root_id = "root"
    //添加taba栏
    gantt.config.columns = columns;

    // 自定义滚动条以确保时间轴始终可见
    gantt.attachEvent("onGanttReady", function () {
      gantt.$grid_scale.style.overflowX = "hidden";
    });

    gantt.attachEvent("onTaskDrag", function (id, mode, task, original) {
      var state = gantt.getState();
      var minDate = state.min_date,
        maxDate = state.max_date;

      var scaleStep =
        gantt.date.add(new Date(), state.scale_step, state.scale_unit) -
        new Date();

      var showDate,
        repaint = false;
      if (mode == "resize" || mode == "move") {
        if (Math.abs(task.start_date - minDate) < scaleStep) {
          showDate = task.start_date;
          repaint = true;
        } else if (Math.abs(task.end_date - maxDate) < scaleStep) {
          showDate = task.end_date;
          repaint = true;
        }

        if (repaint) {
          gantt.render();
          gantt.showDate(showDate);
        }
      }
    });
    gantt.attachEvent("onBeforeGanttRender", function () {
      var range = gantt.getSubtaskDates();
      var scaleUnit = gantt.getState().scale_unit;
      if (range.start_date && range.end_date) {
        gantt.config.start_date = gantt.calculateEndDate(
          range.start_date,
          -15,
          scaleUnit
        );
        gantt.config.end_date = gantt.calculateEndDate(
          range.end_date,
          15,
          scaleUnit
        );
      }
    });
    // 拖动结束后调用API
    gantt.attachEvent("onAfterTaskDrag", function (id, mode, e) {
      const format = (date) => {
        if (date) return gantt.date.date_to_str("%Y-%m-%d %H:%i:%s")(date);
        return "";
      };
      //any custom logic here
      const find = ganttList.find((item) => item.id === id);
      const params = {
        appId,
        worksheetId,
        viewId,
        projectId,
        getType: 1,
        pushUniqueId: Date.now() + "",
        rowId: find.rowid,
      };
      let newOldControl = [];
      if (find.customType === "real") {
        newOldControl.push({
          controlId: taskKeys.startTime1.controlId,
          type: taskKeys.startTime1.type,
          value: format(find.start_date),
          dot: 0,
          controlName: taskKeys.startTime1.controlName,
        });
        newOldControl.push({
          controlId: taskKeys.endTime1.controlId,
          type: taskKeys.startTime1.type,
          value: format(find.end_date),
          dot: 0,
          controlName: taskKeys.endTime1.controlName,
        });
      }
      if (find.customType === "expect") {
        newOldControl.push({
          controlId: taskKeys.startTime2.controlId,
          type: taskKeys.startTime2.type,
          value: format(find.start_date),
          dot: 0,
          controlName: taskKeys.startTime2.controlName,
        });
        newOldControl.push({
          controlId: taskKeys.endTime2.controlId,
          type: taskKeys.startTime2.type,
          value: format(find.end_date),
          dot: 0,
          controlName: taskKeys.endTime2.controlName,
        });
      }
      params.newOldControl = newOldControl;
      updateWorksheetRow(params).then(async () => {
        const { list } = await getData();
        ganttList = list;
        gantt.parse({ data: list });
        gantt.showDate(find.start_date);
      });
    });

    gantt.config.fit_tasks = true;

    gantt.init("gantt_here");
    gantt.parse({ data: list });
    // 让 today 在中心位置
    const timeline = gantt.getLayoutView("timeline");
    const dayLeft = timeline.posFromDate(new Date());
    const timelineWrapperWidth =
      gantt.getLayoutView("timeline").$task.clientWidth;
    gantt.scrollTo(dayLeft - timelineWrapperWidth / 2, null);

    console.log(gantt.getGridColumns());
  };

  

  const [scaleMode, setScaleMode] = useState("day");

  useEffect(() => {
    initGantt({pageIndex, pageSize});
  }, []);

  useLayoutEffect(() => {
    // console.log('useLayoutEffect');
    if (logRef.current) {
      logRef.current.scrollTop = 10000;
    }
  });

  const changeScale = (scaleMode) => {
    setScaleMode(scaleMode);
    gantt.ext.zoom.setLevel(scaleMode);
  };

  const onChange = async (pageIndex, pageSize) => {
    setPageIndex(pageIndex)
    setPageSize(pageSize)
    initGantt({pageIndex, pageSize})
  }

  return (
    <Con>
      <div className="top-wrapper">
        <div className="scales">
          <div
            className={"button day" + (scaleMode === "day" ? " is-active" : "")}
            onClick={() => changeScale("day")}
          >
            日
          </div>
          <div
            className={
              "button week" + (scaleMode === "week" ? " is-active" : "")
            }
            onClick={() => changeScale("week")}
          >
            周
          </div>
          <div
            className={
              "button month" + (scaleMode === "month" ? " is-active" : "")
            }
            onClick={() => changeScale("month")}
          >
            月
          </div>
          <div
            className={
              "button quarter" + (scaleMode === "quarter" ? " is-active" : "")
            }
            onClick={() => changeScale("quarter")}
          >
            季
          </div>
          <div
            className={
              "button year" + (scaleMode === "year" ? " is-active" : "")
            }
            onClick={() => changeScale("year")}
          >
            年
          </div>
        </div>
      </div>
      <div id="gantt_here" className="gantt-container"></div>
      <Pagination
        className="gantt-page"
        total={total}
        current={pageIndex}
        pageSize={pageSize}
        showSizeChanger
        showQuickJumper
        showTotal={total => `总共 ${total} 条`}
        pageSizeOptions={[1,20,50,100]}
        onChange={onChange}
      />
    </Con>
  );
}
