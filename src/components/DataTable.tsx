import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CaretLeft, CaretRight, CaretDoubleLeft, CaretDoubleRight } from '@phosphor-icons/react';
import { Skeleton } from '@/components/ui/skeleton';

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T | string;
  cell?: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (item: T) => void;
  pageSizeOptions?: number[];
  emptyMessage?: string;
  isLoading?: boolean;
  /** Paginación en el servidor: total de páginas desde el backend */
  totalPages?: number;
  /** Página actual (controlada desde fuera) */
  currentPage?: number;
  /** Callback al cambiar de página (para paginación en servidor) */
  onPageChange?: (page: number) => void;
  /** Total de registros (para mostrar "X-Y de Z") */
  totalItems?: number;
  /** Mostrar controles de paginación también arriba de la tabla */
  showPaginationTop?: boolean;
  /** Tamaño de página actual (para paginación servidor) */
  pageSize?: number;
  /** Callback al cambiar tamaño de página */
  onPageSizeChange?: (size: number) => void;
}

function PaginationBar<T>({
  pageSize,
  pageSizeOptions,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  onPageSizeChange,
  serverSide,
}: {
  pageSize: number | 'all';
  pageSizeOptions: number[];
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (value: string) => void;
  serverSide?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-2">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-muted-foreground">Filas por página</p>
        <Select
          value={pageSize.toString()}
          onValueChange={onPageSizeChange || (() => {})}
        >
          <SelectTrigger className="h-8 w-[100px]">
            <SelectValue placeholder={pageSize.toString()} />
          </SelectTrigger>
          <SelectContent side="top">
            {pageSizeOptions.map((option) => (
              <SelectItem key={option} value={option.toString()}>
                {option}
              </SelectItem>
            ))}
            {!serverSide && <SelectItem value="all">Todos</SelectItem>}
          </SelectContent>
        </Select>
        {totalItems != null && (
          <span className="text-sm text-muted-foreground">
            {totalItems} resultado{totalItems !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4 lg:gap-8">
        <div className="flex items-center justify-center text-sm font-medium text-muted-foreground whitespace-nowrap">
          Página {currentPage} de {totalPages || 1}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1 || totalPages <= 1}
          >
            <CaretDoubleLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || totalPages <= 1}
          >
            <CaretLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages <= 1}
          >
            <CaretRight size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || totalPages <= 1}
          >
            <CaretDoubleRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DataTable<T>({
  data,
  columns,
  onRowClick,
  pageSizeOptions = [10, 15, 20, 100],
  emptyMessage = "No se encontraron resultados.",
  isLoading = false,
  totalPages: totalPagesProp,
  currentPage: currentPageProp,
  onPageChange: onPageChangeProp,
  totalItems,
  showPaginationTop = false,
  pageSize: pageSizeProp,
  onPageSizeChange: onPageSizeChangeProp,
}: DataTableProps<T>) {
  const [internalPage, setInternalPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(pageSizeProp ?? pageSizeOptions[0]);

  const serverSide = totalPagesProp != null && onPageChangeProp != null && currentPageProp != null;
  const currentPage = serverSide ? currentPageProp : internalPage;
  const effectivePageSize = serverSide ? (pageSizeProp ?? pageSizeOptions[0]) : pageSize;
  const totalPages = serverSide ? (totalPagesProp ?? 1) : (effectivePageSize === 'all' ? 1 : Math.ceil(data.length / (typeof effectivePageSize === 'number' ? effectivePageSize : 1)));

  const paginatedData = serverSide
    ? data
    : effectivePageSize === 'all'
      ? data
      : data.slice((currentPage - 1) * (typeof effectivePageSize === 'number' ? effectivePageSize : 1), currentPage * (typeof effectivePageSize === 'number' ? effectivePageSize : 1));

  const handlePageChange = (page: number) => {
    if (serverSide && onPageChangeProp) {
      onPageChangeProp(page);
    } else {
      setInternalPage(Math.max(1, Math.min(page, totalPages)));
    }
  };

  const handlePageSizeChange = (value: string) => {
    if (value === 'all') {
      setPageSize('all');
      setInternalPage(1);
      onPageSizeChangeProp?.(pageSizeOptions[0]);
    } else {
      const size = parseInt(value, 10);
      setPageSize(size);
      setInternalPage(1);
      onPageSizeChangeProp?.(size);
    }
  };

  return (
    <div className="space-y-4">
      {showPaginationTop && (
        <PaginationBar
          pageSize={effectivePageSize}
          pageSizeOptions={pageSizeOptions}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          serverSide={serverSide}
        />
      )}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index} className={column.headerClassName}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: typeof pageSize === 'number' ? Math.min(pageSize, 5) : 5 }).map((_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} className={column.className}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  onClick={() => onRowClick?.(item)}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}
                >
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} className={column.className}>
                      {column.cell
                        ? column.cell(item)
                        : column.accessorKey
                          ? (item[column.accessorKey as keyof T] as React.ReactNode)
                          : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationBar
        pageSize={effectivePageSize}
        pageSizeOptions={pageSizeOptions}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        serverSide={serverSide}
      />
    </div>
  );
}
