import { Node, mergeAttributes } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'

export interface HashtagOptions {
  HTMLAttributes: Record<string, any>
  suggestion: any
}

export const Hashtag = Node.create<HashtagOptions>({
  name: 'hashtag',
  inline: true,
  group: 'inline',
  selectable: false,
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: { class: 'text-primary' },
      suggestion: {
        char: '#',
        pluginKey: 'hashtag',
        allowSpaces: false,
        command: ({ editor, range, props }: any) => {
          range && editor.chain().focus().insertContentAt(range, [
            { type: this.name, attrs: props },
            { type: 'text', text: ' ' },
          ]).run()
        },
      },
    }
  },

  addAttributes() {
    return {
      label: { default: null },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-hashtag]'
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes({ 'data-hashtag': '', ...this.options.HTMLAttributes }, HTMLAttributes),
      `#${node.attrs.label}`,
    ]
  },

  renderText({ node }) {
    return `#${node.attrs.label}`
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({ editor: this.editor, ...this.options.suggestion }),
    ]
  },
})

export default Hashtag

