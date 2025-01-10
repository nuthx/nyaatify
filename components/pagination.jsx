import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink
} from "@/components/ui/pagination";

export function PaginationPro({ currentPage, totalPages, onPageChange }) {
  const ItemButton = (page, isActive = false) => (
    <PaginationItem key={page}>
      <PaginationLink className="cursor-pointer" onClick={() => onPageChange(page)} isActive={isActive}>
        {page}
      </PaginationLink>
    </PaginationItem>
  );

  const ButtonGroup = (start, count) => (
    Array.from({ length: count }).map((_, i) => {
      const page = start + i;
      return ItemButton(page, page === currentPage);
    })
  );

  if (totalPages <= 1) {
    return null;
  }

  return (
    <Pagination>
      <PaginationContent>
        {totalPages > 7 ? (
          <>
            {currentPage <= 4 ? (
              <>
                {ButtonGroup(1, 5)}
                <PaginationEllipsis />
                {ItemButton(totalPages)}
              </>
            ) : 
            currentPage > totalPages - 4 ? (
              <>
                {ItemButton(1)}
                <PaginationEllipsis />
                {ButtonGroup(totalPages - 4, 5)}
              </>
            ) : 
            (
              <>
                {ItemButton(1)}
                <PaginationEllipsis />
                {ButtonGroup(currentPage - 2, 5)}
                <PaginationEllipsis />
                {ItemButton(totalPages)}
              </>
            )}
          </>
        ) : (
          ButtonGroup(1, totalPages)
        )}
      </PaginationContent>
    </Pagination>
  );
}
