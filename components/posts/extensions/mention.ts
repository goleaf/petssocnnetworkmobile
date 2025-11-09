import { Node, mergeAttributes } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'

export interface MentionOptions {
  HTMLAttributes: Record<string, any>
  suggestion: any
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mention: {
      setMention: (options: { id: string; label: string }) => ReturnType
    }
  }
}

export const Mention = Node.create<MentionOptions>({
  name: 'mention',
  inline: true,
  group: 'inline',
  selectable: false,
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: { class: 'text-primary' },
      suggestion: {
        char: '@',
        pluginKey: 'mention',
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
      id: { default: null },
      label: { default: null },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-mention]'
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes({ 'data-mention': '', ...this.options.HTMLAttributes }, HTMLAttributes),
      `@${node.attrs.label ?? node.attrs.id}`,
    ]
  },

  renderText({ node }) {
    return `@${node.attrs.label ?? node.attrs.id}`
  },

  addCommands() {
    return {
      setMention: (attrs) => ({ chain }) => {
        return chain().insertContent({ type: this.name, attrs }).run()
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({ editor: this.editor, ...this.options.suggestion }),
    ]
  },
})

export default Mention

