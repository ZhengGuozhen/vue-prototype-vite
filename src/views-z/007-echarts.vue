<template>
  <div id="chart"></div>
</template>
<script>
import * as echarts from 'echarts'

export default {
  components: {},
  props: [],
  data() {
    return {
      modal: true
    }
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {
    // 基于准备好的dom，初始化echarts实例
    const myChart = echarts.init(document.getElementById('chart'))
    // 绘制图表
    myChart.setOption({
      title: {
        text: 'ECharts 入门示例'
      },
      tooltip: {},
      xAxis: {
        data: ['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子']
      },
      yAxis: {},
      series: [
        {
          name: '销量',
          type: 'bar',
          data: [5, 20, 36, 10, 10, 20]
        }
      ]
    })
  },
  methods: {}
}
</script>
<style scoped>
#chart {
  width: 900px;
  height: 600px;
}
</style>
