'use client';

import { useAppDispatch } from '@/store/hooks';
import { addSection } from '@/store/slices/draftPageSlice';
import { Button } from '@/components/ui/button';
import { sectionMetaList } from '@/lib/sectionRegistry';

export function AddSectionPanel() {
  const dispatch = useAppDispatch();
  return (
    <div>
      <h2 className="font-medium mb-2">Add section</h2>
      <div className="flex flex-col gap-2">
        {sectionMetaList.map((meta) => (
          <Button
            key={meta.type}
            variant="secondary"
            className="justify-start"
            onClick={() => dispatch(addSection({ type: meta.type, defaultProps: meta.defaultProps }))}
          >
            + {meta.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
