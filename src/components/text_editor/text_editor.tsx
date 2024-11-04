import { ContentState, convertToRaw, DraftHandleValue, Editor, EditorState, getDefaultKeyBinding, Modifier, RichUtils } from "draft-js";
import { useEffect, useRef, useState } from "react";
import './TextEditor.css';
import { findDOMNode } from "react-dom";
import { TextStructure } from "./text_editor_type";

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

    const componentRef = useRef(null);
    const placeholder = (domNode: HTMLElement, cl: string, selector: string) => {
      const targetDiv = domNode.querySelectorAll(selector);
      targetDiv.forEach(e => {
        const br = e.querySelector('br');
        if(br) {
          e.classList.add(cl);
        } else {
          e.classList.remove(cl);
        }
        
      })
    }

    useEffect(() => {
        if (componentRef.current) {
            const domNode = findDOMNode(componentRef.current);
            if (domNode instanceof HTMLElement) { 
                placeholder(domNode, 'placeholder-h1','.DraftEditor-editorContainer h1 div span');
                placeholder(domNode, 'placeholder-h2','.DraftEditor-editorContainer h2 div span');
                placeholder(domNode, 'placeholder-li','.DraftEditor-editorContainer li div span');
            }
        
        }
    })

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
        if(editorState.getCurrentContent().getBlockForKey(editorState.getSelection().getStartKey()).getType() === "unordered-list-item"){
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

    const handlePaste = (text: string): DraftHandleValue => {
        const contentState = editorState.getCurrentContent();
        const selection = editorState.getSelection();
    
        // Вставляем текст в текущий блок, сохраняя его тип
        const newContentState = Modifier.replaceText(contentState, selection, text);
        const newEditorState = EditorState.push(editorState, newContentState, 'insert-characters');
    
        // Обновляем состояние редактора
        setEditorState(newEditorState);
        return 'handled';
    };
    
    return (
        <div className="editor-container">
            <Editor
                ref={componentRef}
                editorState={editorState}
                onChange={handleTitleChange}
                handleKeyCommand={handleKeyCommand}
                keyBindingFn={keyBindingFn}
                onBlur={blur}
                handlePastedText={handlePaste}
            />
            <button onClick={toggleHeading}>Heading</button>
        </div>

    )
}