import React, { useMemo } from 'react';
import { Node } from '@xyflow/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FieldError } from './FieldError';
import { validateRequired, validateJson, validateTableName } from './validation';

interface DatabaseNodeFormProps {
  node: Node;
  onDataChange: (key: string, value: unknown) => void;
}

export function DatabaseNodeForm({ node, onDataChange }: DatabaseNodeFormProps) {
  const { t } = useLanguage();
  const data = node.data as Record<string, unknown>;

  const operation = (data.dbOperation as string) || 'select';

  // Validation errors
  const errors = useMemo(() => {
    const errs: Record<string, string | null> = {};
    
    // Table name required for non-RPC operations
    if (operation !== 'rpc') {
      errs.tableName = validateRequired(data.tableName, 'tableName') || 
                       validateTableName(data.tableName as string || '');
    }
    
    // RPC function name required for RPC
    if (operation === 'rpc') {
      errs.rpcFunction = validateRequired(data.rpcFunction, 'rpcFunction');
    }
    
    // JSON validation for filters
    if (typeof data.filters === 'string' && data.filters) {
      errs.filters = validateJson(data.filters);
    }
    
    // JSON validation for dbData
    if (typeof data.dbData === 'string' && data.dbData) {
      errs.dbData = validateJson(data.dbData);
    }
    
    // JSON validation for rpcParams
    if (typeof data.rpcParams === 'string' && data.rpcParams) {
      errs.rpcParams = validateJson(data.rpcParams);
    }
    
    return errs;
  }, [data.tableName, data.rpcFunction, data.filters, data.dbData, data.rpcParams, operation]);

  return (
    <div className="space-y-4">
      {/* Basic Settings */}
      <div className="space-y-2">
        <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
        <Input
          id="label"
          value={(data.label as string) || ''}
          onChange={(e) => onDataChange('label', e.target.value)}
          placeholder={t('flowEditor.nodes.database')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dbOperation">{t('flowEditor.properties.dbOperation')}</Label>
        <Select
          value={operation}
          onValueChange={(value) => onDataChange('dbOperation', value)}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder={t('flowEditor.properties.selectDbOperation')} />
          </SelectTrigger>
          <SelectContent className="bg-popover border z-50">
            <SelectItem value="select">{t('flowEditor.properties.dbSelect')}</SelectItem>
            <SelectItem value="insert">{t('flowEditor.properties.dbInsert')}</SelectItem>
            <SelectItem value="update">{t('flowEditor.properties.dbUpdate')}</SelectItem>
            <SelectItem value="delete">{t('flowEditor.properties.dbDelete')}</SelectItem>
            <SelectItem value="upsert">{t('flowEditor.properties.dbUpsert')}</SelectItem>
            <SelectItem value="rpc">{t('flowEditor.properties.dbRpc')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tableName">{t('flowEditor.properties.tableName')}</Label>
        <Input
          id="tableName"
          value={(data.tableName as string) || ''}
          onChange={(e) => onDataChange('tableName', e.target.value)}
          placeholder={t('flowEditor.properties.tableNamePlaceholder')}
          className={errors.tableName ? 'border-destructive' : ''}
        />
        <FieldError error={errors.tableName} />
      </div>

      <Separator />

      {/* Query Configuration */}
      <Accordion type="single" collapsible defaultValue="query">
        <AccordionItem value="query" className="border-none">
          <AccordionTrigger className="py-2 text-sm">
            {t('flowEditor.properties.queryConfig')}
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            {/* Columns (for SELECT) */}
            {operation === 'select' && (
              <div className="space-y-2">
                <Label htmlFor="columns">{t('flowEditor.properties.columns')}</Label>
                <Input
                  id="columns"
                  value={(data.columns as string) || '*'}
                  onChange={(e) => onDataChange('columns', e.target.value)}
                  placeholder="*, id, name, created_at"
                />
                <p className="text-xs text-muted-foreground">
                  {t('flowEditor.properties.columnsHint')}
                </p>
              </div>
            )}

            {/* Filters */}
            <div className="space-y-2">
              <Label htmlFor="filters">{t('flowEditor.properties.filters')}</Label>
              <Textarea
                id="filters"
                value={
                  typeof data.filters === 'object'
                    ? JSON.stringify(data.filters, null, 2)
                    : (data.filters as string) || ''
                }
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    onDataChange('filters', parsed);
                  } catch {
                    onDataChange('filters', e.target.value);
                  }
                }}
                placeholder='{"id": "eq.{{input.id}}", "status": "eq.active"}'
                rows={3}
                className={`font-mono text-sm ${errors.filters ? 'border-destructive' : ''}`}
              />
              <FieldError error={errors.filters} />
              <p className="text-xs text-muted-foreground">
                {t('flowEditor.properties.filtersHint')}
              </p>
            </div>

            {/* Data for INSERT/UPDATE */}
            {(operation === 'insert' || operation === 'update' || operation === 'upsert') && (
              <div className="space-y-2">
                <Label htmlFor="dbData">{t('flowEditor.properties.dbData')}</Label>
                <Textarea
                  id="dbData"
                  value={
                    typeof data.dbData === 'object'
                      ? JSON.stringify(data.dbData, null, 2)
                      : (data.dbData as string) || ''
                  }
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      onDataChange('dbData', parsed);
                    } catch {
                      onDataChange('dbData', e.target.value);
                    }
                  }}
                  placeholder='{"name": "{{input.name}}", "email": "{{input.email}}"}'
                  rows={4}
                  className={`font-mono text-sm ${errors.dbData ? 'border-destructive' : ''}`}
                />
                <FieldError error={errors.dbData} />
                <p className="text-xs text-muted-foreground">
                  {t('flowEditor.properties.dbDataHint')}
                </p>
              </div>
            )}

            {/* RPC Function Name */}
            {operation === 'rpc' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="rpcFunction">{t('flowEditor.properties.rpcFunction')}</Label>
                  <Input
                    id="rpcFunction"
                    value={(data.rpcFunction as string) || ''}
                    onChange={(e) => onDataChange('rpcFunction', e.target.value)}
                    placeholder="my_function_name"
                    className={errors.rpcFunction ? 'border-destructive' : ''}
                  />
                  <FieldError error={errors.rpcFunction} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rpcParams">{t('flowEditor.properties.rpcParams')}</Label>
                  <Textarea
                    id="rpcParams"
                    value={
                      typeof data.rpcParams === 'object'
                        ? JSON.stringify(data.rpcParams, null, 2)
                        : (data.rpcParams as string) || ''
                    }
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        onDataChange('rpcParams', parsed);
                      } catch {
                        onDataChange('rpcParams', e.target.value);
                      }
                    }}
                    placeholder='{"param1": "value1"}'
                    rows={3}
                    className={`font-mono text-sm ${errors.rpcParams ? 'border-destructive' : ''}`}
                  />
                  <FieldError error={errors.rpcParams} />
                </div>
              </>
            )}

            {/* Ordering (for SELECT) */}
            {operation === 'select' && (
              <div className="space-y-2">
                <Label htmlFor="orderBy">{t('flowEditor.properties.orderBy')}</Label>
                <Input
                  id="orderBy"
                  value={(data.orderBy as string) || ''}
                  onChange={(e) => onDataChange('orderBy', e.target.value)}
                  placeholder="created_at.desc, name.asc"
                />
              </div>
            )}

            {/* Limit (for SELECT) */}
            {operation === 'select' && (
              <div className="space-y-2">
                <Label htmlFor="limit">{t('flowEditor.properties.limit')}</Label>
                <Input
                  id="limit"
                  type="number"
                  value={(data.limit as number) || ''}
                  onChange={(e) => onDataChange('limit', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="100"
                  min={1}
                  max={10000}
                />
              </div>
            )}

            {/* Single row mode */}
            {operation === 'select' && (
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="singleRow">{t('flowEditor.properties.singleRow')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('flowEditor.properties.singleRowHint')}
                  </p>
                </div>
                <Switch
                  id="singleRow"
                  checked={(data.singleRow as boolean) || false}
                  onCheckedChange={(checked) => onDataChange('singleRow', checked)}
                />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* On conflict for upsert */}
      {operation === 'upsert' && (
        <div className="space-y-2">
          <Label htmlFor="onConflict">{t('flowEditor.properties.onConflict')}</Label>
          <Input
            id="onConflict"
            value={(data.onConflict as string) || ''}
            onChange={(e) => onDataChange('onConflict', e.target.value)}
            placeholder="id"
          />
          <p className="text-xs text-muted-foreground">
            {t('flowEditor.properties.onConflictHint')}
          </p>
        </div>
      )}
    </div>
  );
}
