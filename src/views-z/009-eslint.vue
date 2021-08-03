<template>
  <div>
    <el-input
      placeholder="请输入单行文本"
      v-model="formData.field101"
      clearable
      :style="{ width: '100%' }"
    >
    </el-input>
  </div>
</template>
<script>

import a from './002-js.js'

export default {
  components: {},
  props: [],
  data() {
    return {}
  },
  computed: {},
  watch: {},
  created() {
    let i = 0
    i++
    console.log(i)

    if (1) ++i


    i++
  },
  mounted() {},
  methods: {
    test() {}
  }
}
</script>
<style scoped></style>
