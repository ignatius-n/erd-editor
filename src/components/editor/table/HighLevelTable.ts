import { Table } from '@@types/engine/store/table.state';
import { Move } from '@/internal-types/event.helper';
import {
  defineComponent,
  html,
  FunctionalComponent,
  beforeMount,
} from '@dineug/lit-observable';
import { styleMap } from 'lit-html/directives/style-map';
import { classMap } from 'lit-html/directives/class-map';
import { Tween, Easing } from '@tweenjs/tween.js';
import { useContext } from '@/core/hooks/context.hook';
import { useUnmounted } from '@/core/hooks/unmounted.hook';
import { relationshipSort } from '@/engine/store/helper/relationship.helper';
import { Bus } from '@/core/helper/eventBus.helper';
import { selectTable$, moveTable } from '@/engine/command/table.cmd.helper';
import { SIZE_TABLE_PADDING, SIZE_TABLE_BORDER } from '@/core/layout';

declare global {
  interface HTMLElementTagNameMap {
    'vuerd-high-level-table': HighLevelTableElement;
  }
}

export interface HighLevelTableProps {
  table: Table;
}

export interface HighLevelTableElement
  extends HighLevelTableProps,
    HTMLElement {}

const TABLE_PADDING = (SIZE_TABLE_PADDING + SIZE_TABLE_BORDER) * 2;
const ANIMATION_TIME = 300;

const HighLevelTable: FunctionalComponent<
  HighLevelTableProps,
  HighLevelTableElement
> = (props, ctx) => {
  const contextRef = useContext(ctx);
  const { unmountedGroup } = useUnmounted();
  let leftTween: Tween<{ left: number }> | null = null;
  let topTween: Tween<{ top: number }> | null = null;

  const getFontSize = () => {
    const { zoomLevel } = contextRef.value.store.canvasState;
    let fontSize = 25;

    if (zoomLevel > 0.6) {
      fontSize = 25;
    } else if (zoomLevel > 0.5) {
      fontSize = 30;
    } else if (zoomLevel > 0.4) {
      fontSize = 35;
    } else if (zoomLevel > 0.3) {
      fontSize = 40;
    } else {
      fontSize = 45;
    }

    return fontSize;
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
    const { store, globalEvent, eventBus } = contextRef.value;
    const { drag$ } = globalEvent;

    if (!el.closest('.vuerd-button') && !el.closest('vuerd-input')) {
      leftTween?.stop();
      topTween?.stop();

      drag$.subscribe({
        next: onMove,
        complete: () => eventBus.emit(Bus.BalanceRange.move),
      });
    }
    if (!el.closest('vuerd-input-edit')) {
      store.dispatch(
        selectTable$(store, event.ctrlKey || event.metaKey, props.table.id)
      );
    }
  };

  const moveBalance = () => {
    const {
      canvasState: { width, height },
      tableState: { tables },
      relationshipState: { relationships },
    } = contextRef.value.store;
    const minWidth = width - (props.table.width() + TABLE_PADDING);
    const minHeight = height - (props.table.height() + TABLE_PADDING);
    const x = props.table.ui.left > minWidth ? minWidth : 0;
    const y = props.table.ui.top > minHeight ? minHeight : 0;

    if (props.table.ui.left < 0 || props.table.ui.left > minWidth) {
      leftTween = new Tween(props.table.ui)
        .to({ left: x }, ANIMATION_TIME)
        .easing(Easing.Quadratic.Out)
        .onUpdate(() => relationshipSort(tables, relationships))
        .onComplete(() => (leftTween = null))
        .start();
    }

    if (props.table.ui.top < 0 || props.table.ui.top > minHeight) {
      topTween = new Tween(props.table.ui)
        .to({ top: y }, ANIMATION_TIME)
        .easing(Easing.Quadratic.Out)
        .onUpdate(() => relationshipSort(tables, relationships))
        .onComplete(() => (topTween = null))
        .start();
    }
  };

  beforeMount(() => {
    const { eventBus } = contextRef.value;
    unmountedGroup.push(
      eventBus.on(Bus.BalanceRange.move).subscribe(moveBalance)
    );
  });

  return () => {
    const { table } = props;
    const { ui } = table;
    table.maxWidthColumn();

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
        <div
          class="vuerd-high-level-table vuerd-scrollbar"
          style=${styleMap({
            fontSize: `${getFontSize()}px`,
          })}
        >
          ${table.name}
        </div>
      </div>
    `;
  };
};

defineComponent('vuerd-high-level-table', {
  observedProps: ['table'],
  shadow: false,
  render: HighLevelTable,
});
