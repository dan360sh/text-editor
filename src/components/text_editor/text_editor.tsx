import { ContentState, convertToRaw, DraftHandleValue, Editor, EditorState, getDefaultKeyBinding, Modifier, RichUtils } from "draft-js";
import { SyntheticEvent, useState } from "react";
import './TextEditor.css';
interface ContentBlocks {
    heading: string | null,
    bullets: string[]
}
interface TextStructure {
    title: string | null,
    content_blocks: ContentBlocks[]
  }

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

    //Делает буллит заголовком списка
    const toggleHeading = () => {
        if(editorState.getCurrentContent().getBlockForKey(editorState.getSelection().getStartKey()).getType()==="unordered-list-item"){
          setEditorState(RichUtils.toggleBlockType(editorState, 'header-two'));
        }
    };

    const blur = () => {
        const textStructure: TextStructure = {title: '', content_blocks: []}
        const constentParce = convertToRaw(editorState.getCurrentContent());
        for(let line of constentParce.blocks) {
            if(line.type === "header-one"){
                textStructure.title = line.text;
            }
            
            if(line.type === "header-two"){
                textStructure.content_blocks.push({heading : line.text, bullets: []})
            }

            if(line.type === "unordered-list-item") {
                const content_block = textStructure.content_blocks[textStructure.content_blocks.length - 1];
                content_block.bullets.push(line.text);
            }
        }

        console.log('Cтруктура текста:', JSON.stringify(textStructure));
        console.log(textStructure);
    }
    
    return (
        <div className="editor-container">
            <Editor
                editorState={editorState}
                onChange={handleTitleChange}
                handleKeyCommand={handleKeyCommand}
                keyBindingFn={keyBindingFn}
                onBlur={blur}
            />
            <button onClick={toggleHeading}>Heading</button>
        </div>

    )
}