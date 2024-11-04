import { ContentState, convertToRaw, DraftHandleValue, Editor, EditorState, getDefaultKeyBinding, Modifier } from "draft-js";
import { useState } from "react";

export default function TextEditor () {
    const [editorState, setEditorState] = useState<EditorState>(() =>{
        // Создаем начальное состояние с пустым контентом
        const contentState = ContentState.createFromText('');
        let initialEditorState = EditorState.createWithContent(contentState);
        
        // Устанавливаем первую строку как `header-one`
        const firstBlockKey = contentState.getFirstBlock().getKey();
        const updatedContentState = Modifier.setBlockType(
          contentState,
          contentState.getSelectionAfter().merge({
            anchorKey: firstBlockKey,
            focusKey: firstBlockKey,
          }),
          'header-one'
        );
        
        initialEditorState = EditorState.push(initialEditorState, updatedContentState, 'change-block-type');
        return initialEditorState;
    });

    const handleTitleChange = (newEditorState: EditorState) => {
        setEditorState(newEditorState);
    }

    // Настройка привязки клавиш, чтобы Enter применял стиль буллита
    const keyBindingFn = (e: React.KeyboardEvent): string | null => {
        if (e.key === 'Enter') {
        return 'insert-newline';
        }
        return getDefaultKeyBinding(e);
    };

    const getLineNumber = (editorState: EditorState): number => {
        const blockKey = editorState.getSelection().getAnchorKey();
        const blockArray = editorState.getCurrentContent().getBlockMap().toArray();
        return blockArray.findIndex(block => block.getKey() === blockKey);
    }

    // Обработка нажатия клавиши Enter для добавления буллита по умолчанию
    const handleKeyCommand = (command: string, editorState: EditorState): DraftHandleValue => {
        if (command === 'insert-newline') {
          let blockType = 'unordered-list-item';

          if(getLineNumber(editorState) === 0){
            blockType = 'header-two';
          }

          // Создаём новую пустую строку
          const newContentState = Modifier.splitBlock(editorState.getCurrentContent(), editorState.getSelection());
          const newEditorState = EditorState.push(editorState, newContentState, 'split-block');

          //Перемещаем курсор на новую строку
          const updatedEditorState = EditorState.forceSelection(
            newEditorState,
            newContentState.getSelectionAfter()
          );
          
          //применяем стили
          const styledContent = Modifier.setBlockType(
            updatedEditorState.getCurrentContent(),
            updatedEditorState.getSelection(),
            blockType
          );
          
          setEditorState(EditorState.push(updatedEditorState, styledContent, 'change-block-type'));
          return 'handled';
        }
        return 'not-handled';
    }
    
    return (
        <Editor
            editorState={editorState}
            onChange={handleTitleChange}
            handleKeyCommand={handleKeyCommand}
            keyBindingFn={keyBindingFn}
        />

    )
}