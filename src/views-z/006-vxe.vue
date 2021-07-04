<template>
  <div>
    <vxe-modal
      v-model="modal"
      id="myModal6"
      width="200"
      height="100"
      min-width="50"
      min-height="50"
      resize
      remember
      storage
      :className="'modal'"
      :lockView="false"
      :mask="false"
    >
      <template v-slot:title>
        <span>title</span>
      </template>
      <template v-slot>
        <span>zgz</span>
      </template>
    </vxe-modal>
  </div>
</template>
<script lang="ts">
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
  mounted() {},
  methods: {}
}
</script>
<style scoped></style>
