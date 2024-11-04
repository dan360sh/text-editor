import { ContentState, Editor, EditorState, Modifier } from "draft-js";
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
    
    return (
        <Editor
            editorState={editorState}
            onChange={handleTitleChange}
        />

    )
}