import '@/components/editor/Input';
import '@/components/editor/table/column/Column';

import { Table } from '@@types/engine/store/table.state';
import { Move } from '@/internal-types/event.helper';
import {
  defineComponent,
  html,
  FunctionalComponent,
} from '@dineug/lit-observable';
import { classMap } from 'lit-html/directives/class-map';
import { styleMap } from 'lit-html/directives/style-map';
import { repeat } from 'lit-html/directives/repeat';
import { keymapOptionsToString } from '@/core/keymap';
import { useContext } from '@/core/hooks/context.hook';
import { useTooltip } from '@/core/hooks/tooltip.hook';
import {
  changeTableName,
  changeTableComment,
  selectTable$,
  moveTable,
  removeTable,
} from '@/engine/command/table.cmd.helper';
import { addColumn } from '@/engine/command/column.cmd.helper';
import { isFocus } from '@/engine/store/editor.helper';

declare global {
  interface HTMLElementTagNameMap {
    'vuerd-table': TableElement;
  }
}

export interface TableProps {
  table: Table;
}

export interface TableElement extends TableProps, HTMLElement {}

const Table: FunctionalComponent<TableProps, TableElement> = (props, ctx) => {
  const contextRef = useContext(ctx);
  useTooltip(['.vuerd-button'], ctx);

  const onInput = (event: InputEvent, focusType: string) => {
    const { store, helper } = contextRef.value;
    const input = event.target as HTMLInputElement;
    switch (focusType) {
      case 'tableName':
        store.dispatch(changeTableName(helper, props.table.id, input.value));
        break;
      case 'tableComment':
        store.dispatch(changeTableComment(helper, props.table.id, input.value));
        break;
    }
  };

  const onMove = ({ event, movementX, movementY }: Move) => {
    event.type === 'mousemove' && event.preventDefault();
    const { store } = contextRef.value;
    store.dispatch(
      moveTable(
        store,
        event.ctrlKey || event.metaKey,
        movementX,
        movementY,
        props.table.id
      )
    );
  };

  const onMoveStart = (event: MouseEvent | TouchEvent) => {
    const el = event.target as HTMLElement;
    const { store, globalEvent } = contextRef.value;
    const { drag$ } = globalEvent;

    if (!el.closest('.vuerd-button') && !el.closest('vuerd-input')) {
      drag$.subscribe(onMove);
    }
    if (!el.closest('vuerd-input-edit')) {
      store.dispatch(
        selectTable$(store, event.ctrlKey || event.metaKey, props.table.id)
      );
    }
  };

  const onRemoveTable = () => {
    const { store } = contextRef.value;
    store.dispatch(removeTable(store, props.table.id));
  };

  const onAddColumn = () => {
    const { store } = contextRef.value;
    store.dispatch(addColumn(store, props.table.id));
  };

  return () => {
    const {
      keymap,
      store: {
        canvasState: { show },
        editorState,
      },
    } = contextRef.value;
    const table = props.table;
    const { ui, columns } = table;

    return html`
      <div
        class=${classMap({
          'vuerd-table': true,
          active: ui.active,
        })}
        style=${styleMap({
          top: `${ui.top}px`,
          left: `${ui.left}px`,
          zIndex: `${ui.zIndex}`,
          width: `${table.width()}px`,
          height: `${table.height()}px`,
        })}
        @mousedown=${onMoveStart}
        @touchstart=${onMoveStart}
      >
        <div class="vuerd-table-header">
          <div class="vuerd-table-header-top">
            <vuerd-icon
              class="vuerd-button"
              data-tippy-content=${keymapOptionsToString(keymap.removeTable)}
              name="times"
              size="12"
              @click=${onRemoveTable}
            ></vuerd-icon>
            <vuerd-icon
              class="vuerd-button"
              data-tippy-content=${keymapOptionsToString(keymap.addColumn)}
              name="plus"
              size="12"
              @click=${onAddColumn}
            ></vuerd-icon>
          </div>
          <div class="vuerd-table-header-body">
            <vuerd-input
              class="vuerd-table-name"
              .width=${table.ui.widthName}
              .value=${table.name}
              .focusState=${isFocus(
                editorState.focusTable,
                'tableName',
                table.id
              )}
              placeholder="table"
              @input=${(event: InputEvent) => onInput(event, 'tableName')}
            ></vuerd-input>
            ${show.tableComment
              ? html`
                  <vuerd-input
                    class="vuerd-table-comment"
                    .width=${table.ui.widthComment}
                    .value=${table.comment}
                    .focusState=${isFocus(
                      editorState.focusTable,
                      'tableComment',
                      table.id
                    )}
                    placeholder="comment"
                    @input=${(event: InputEvent) =>
                      onInput(event, 'tableComment')}
                  ></vuerd-input>
                `
              : null}
          </div>
        </div>
        <div class="vuerd-table-body">
          ${repeat(
            columns,
            column => column.id,
            column =>
              html`
                <vuerd-column
                  .tableId=${table.id}
                  .column=${column}
                ></vuerd-column>
              `
          )}
        </div>
      </div>
    `;
  };
};

defineComponent('vuerd-table', {
  observedProps: ['table'],
  shadow: false,
  render: Table,
});
