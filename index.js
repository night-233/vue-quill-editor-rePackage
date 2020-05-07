
<template>
  <div>
    <quilleditor v-model="content" :ref="editorName" :options="editorOption" @change="onChange">
      <div :id="editorName" slot="toolbar">
        <span class="ql-formats">
          <button type="button" class="ql-bold"></button>
        </span>
        <span class="ql-formats">
          <button type="button" class="ql-italic"></button>
        </span>

        <span class="ql-formats">
          <button type="button" class="ql-blockquote"></button>
        </span>

        <span class="ql-formats">
          <button type="button" class="ql-list" value="ordered"></button>
        </span>

        <span class="ql-formats">
          <button type="button" class="ql-list" value="bullet"></button>
        </span>

        <span class="ql-formats">
          <button type="button" class="ql-link"></button>
        </span>
        <span class="ql-formats">
          <button type="button" class="ql-underline"></button>
        </span>
        <span class="ql-formats">
          <button type="button" class="ql-strike"></button>
        </span>
        <span class="ql-formats">
          <button type="button" class="ql-strike"></button>
        </span>
        <span class="ql-formats">
          <button type="button" class="ql-header" value="1"></button>
          <button type="button" class="ql-header" value="2"></button>
        </span>
        <span class="ql-formats">
          <button type="button" class="ql-script" value="sub"></button>
          <button type="button" class="ql-script" value="super"></button>
        </span>
        <span class="ql-formats">
          <button type="button" class="ql-indent" value="-1"></button>
          <button type="button" class="ql-indent" value="+1"></button>
        </span>
        <span class="ql-formats">
          <button type="button" class="ql-direction" value="rtl"></button>
        </span>
        <select class="ql-size">
          <option value="small"></option>
          <!-- Note a missing, thus falsy value, is used to reset to default -->
          <option selected></option>
          <option value="large"></option>
          <option value="huge"></option>
        </select>
        <select class="ql-align ql-picker ql-icon-picker">
          <option class="ql-picker-label" value="center"></option>
          <!-- Note a missing, thus falsy value, is used to reset to default -->
          <option class="ql-picker-options"></option>

          <!-- <option class="ql-picker-item" value="center"></option> -->
          <option class="ql-picker-item" value="right"></option>
          <option class="ql-picker-item" value="justify"></option>
        </select>

        <span class="ql-formats">
          <button type="button" @click="imgClick" style="outline:none">
            <svg viewBox="0 0 18 18">
              <rect class="ql-stroke" height="10" width="12" x="3" y="4" />
              <circle class="ql-fill" cx="6" cy="7" r="1" />
              <polyline class="ql-even ql-fill" points="5 12 5 11 7 9 8 10 11 7 13 9 13 12 5 12" />
            </svg>
          </button>
        </span>

        <span class="ql-formats">
          <button type="button" class="ql-video"></button>
        </span>
      </div>
    </quilleditor>
  </div>
</template>

<script>
import { quillEditor } from 'vue-quill-editor';
import request from '@/plugin/axios'; // 请根据自己demo项目情况正确引入
export default {
  props: {
    editorContent: {
      type: String,
      required: true
    },
    editorName: {
      type: String,
      required: true
    },
    /* 上传图片的地址 */
    uploadUrl: {
      type: String,
      default: 'http://up-z0.qiniu.com' // 默认为七牛的地址
    },
    /* 上传图片的file控件 name */
    fileName: {
      type: String,
      default: 'file'
    },
    uploadImageCb: {
      type: Function
    }
  },
  data () {
    return {
      editorOption: {
        modules: {
          toolbar: {
            container: `#${this.editorName}` // 容器Id
          }
        }
      },
      content: '*' // 默认的 editorContent 内容
    };
  },
  computed: {
    editor () {
      return this.$refs[this.editorName].quill;
    } // 根据不同的 editorName 生成 editor 实例
  },
  mounted () {
    this.content = this.editorContent; // 初始化 富文本编辑器的内容
  },

  methods: {
    onChange () {
      this.$emit('input', this.content);
    },
    // 重写点击上传图片按钮
    imgClick () {
      if (!this.uploadUrl) {
        console.log('no editor uploadUrl');
        return;
      }
      // 内存创建input file
      var input = document.createElement('input');
      input.type = 'file';
      input.name = this.fileName;
      input.accept = 'image/jpeg,image/png,image/jpg,image/gif';
      input.onchange = this.onFileChange;
      input.click();
      this.editor.focus();
    },
    // 监听 onchange
    onFileChange (e) {
      const file = e.target.files[0];
      if (file.length === 0) {
        return;
      }
      // 图片限制
      if (this.beforeUpload(file)) {
        // 如果上传到其他服务器而不是七牛云，这里可能需要做一个判断。if 部分是伪代码
        if (notQiniu) {
          // 自定义cb函数
          this.uploadImageCb().then(() => {
            // do something
          });
        } else {
          this.uploadImage(file);
        }
      }
    },
    beforeUpload (file) {
      const limits = this.$store.getters.limits.logoSizeLimit; // 可根据后台限制图片大小，根据具体情况设定
      const size = Math.floor(Number(limits) / 1024);
      const isLimit = file.size < limits;
      if (!isLimit) {
        this.$message.error(`上传图片大小不可超过 ${size} KB`);
      }
      return isLimit;
    },
    // 上传重点部分
    uploadImage (file) {
      let data = new FormData();
      data.append('token', this.$store.getters.upload_data.token); // 添加七牛云 token
      data.append(this.fileName, file);
      request({
        url: this.uploadUrl, // url
        method: 'post',
        data: data,
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        }
      }).then(res => {
        this.editor.insertEmbed(
          this.editor.getSelection().index,
          'image',
          'https://www.abc.com/' + res.key
        ); // 利用 getSelection 和 insertEmbed，根据业务需求重新设置 上传后图片的 url
      });
    }
  },
  watch: {
    value (newVal, oldVal) {
      if (this.editor) {
        if (newVal !== this.content) {
          this.content = newVal;
        }
      }
    }
  }
};
</script>
