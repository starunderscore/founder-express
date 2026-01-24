"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useFinanceStore } from '@/state/financeStore';
import { ActionIcon, Button, Card, Group, Modal, NumberInput, Select, Stack, Table, Text, TextInput, Title, Checkbox, MultiSelect, Tabs, Badge, SegmentedControl, Menu } from '@mantine/core';
import { useMemo, useState } from 'react';

export default function FinanceSettingsPage() {
  const settings = useFinanceStore((s) => s.settings);
  const setCurrency = useFinanceStore((s) => s.setCurrency);
  const setGracePeriodDays = useFinanceStore((s) => s.setGracePeriodDays);
  const setEnforceTax = useFinanceStore((s) => (s as any).setEnforceTax || (() => {}));
  const setQuickBooksEnabled = useFinanceStore((s) => (s as any).setQuickBooksEnabled || (() => {}));
  const setQuickBooksCompanyId = useFinanceStore((s) => (s as any).setQuickBooksCompanyId || (() => {}));
  const addTax = useFinanceStore((s) => s.addTax);
  const updateTax = useFinanceStore((s) => s.updateTax);
  const removeTax = useFinanceStore((s) => s.removeTax);
  const addTemplate = useFinanceStore((s) => s.addTemplate);
  const updateTemplate = useFinanceStore((s) => s.updateTemplate);
  const removeTemplate = useFinanceStore((s) => s.removeTemplate);
  const products = useFinanceStore((s) => s.settings.products);
  const addProduct = useFinanceStore((s) => s.addProduct);
  const updateProduct = useFinanceStore((s) => s.updateProduct);
  const removeProduct = useFinanceStore((s) => s.removeProduct);
  const addPriceToProduct = useFinanceStore((s) => s.addPriceToProduct);
  const updatePriceOnProduct = useFinanceStore((s) => s.updatePriceOnProduct);
  const removePriceFromProduct = useFinanceStore((s) => s.removePriceFromProduct);
  const archiveProduct = useFinanceStore((s) => s.archiveProduct);
  const restoreProduct = useFinanceStore((s) => s.restoreProduct);
  const archiveTax = useFinanceStore((s) => s.archiveTax);
  const restoreTax = useFinanceStore((s) => s.restoreTax);
  const archiveTemplate = useFinanceStore((s) => s.archiveTemplate);
  const restoreTemplate = useFinanceStore((s) => s.restoreTemplate);

  const [taxOpen, setTaxOpen] = useState(false);
  const [editingTaxId, setEditingTaxId] = useState<string | null>(null);
  const [taxName, setTaxName] = useState('');
  const [taxRate, setTaxRate] = useState<number | string>('');
  const [tplOpen, setTplOpen] = useState(false);
  const [editingTplId, setEditingTplId] = useState<string | null>(null);
  const [tplName, setTplName] = useState('');
  const [tplItems, setTplItems] = useState<{ id: string; description: string; quantity: string; unitPrice: string }[]>([]);
  const [tplTaxIds, setTplTaxIds] = useState<string[]>([]);
  const [prodOpen, setProdOpen] = useState(false);
  const [prodIdEditing, setProdIdEditing] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [priceOpen, setPriceOpen] = useState(false);
  const [priceProdId, setPriceProdId] = useState<string | null>(null);
  const [priceIdEditing, setPriceIdEditing] = useState<string | null>(null);
  const [priceCurrency, setPriceCurrency] = useState(settings.currency);
  const [priceAmount, setPriceAmount] = useState<number | string>('');
  const [priceType, setPriceType] = useState<'one_time' | 'recurring'>('one_time');
  const [priceInterval, setPriceInterval] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [priceIntervalCount, setPriceIntervalCount] = useState<number | string>('1');

  const [prodView, setProdView] = useState<'all' | 'one_time' | 'recurring' | 'mixed'>('all');
  const filteredProducts = useMemo(() => {
    const classify = (p: any): 'one_time' | 'recurring' | 'mixed' | 'none' => {
      const hasOne = Array.isArray(p.prices) && p.prices.some((pr: any) => pr.type === 'one_time');
      const hasRec = Array.isArray(p.prices) && p.prices.some((pr: any) => pr.type === 'recurring');
      if (hasOne && hasRec) return 'mixed';
      if (hasRec) return 'recurring';
      if (hasOne) return 'one_time';
      return 'none';
    };
    if (prodView === 'all') return products;
    return products.filter((p) => classify(p) === prodView);
  }, [products, prodView]);

  const taxOptions = useMemo(() => settings.taxes.map((t) => ({ value: t.id, label: `${t.name} (${t.rate}%)` })), [settings.taxes]);

  const addTplRow = () => setTplItems((rows) => [...rows, { id: `row-${Date.now()}-${Math.random()}`, description: '', quantity: '1', unitPrice: '0' }]);
  const removeTplRow = (id: string) => setTplItems((rows) => rows.filter((r) => r.id !== id));
  const updateTplRow = (id: string, patch: Partial<{ description: string; quantity: string; unitPrice: string }>) => setTplItems((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <EmployerAuthGate>
      <Title order={2} mb="sm">Financial settings</Title>
      <Text c="dimmed" mb="md">Configure currency, taxes, templates, and products.</Text>

      <Tabs defaultValue="general">
        <Tabs.List>
          <Tabs.Tab value="general">General</Tabs.Tab>
          <Tabs.Tab value="products">Products</Tabs.Tab>
          <Tabs.Tab value="taxes">Taxes</Tabs.Tab>
          <Tabs.Tab value="templates">Invoice templates</Tabs.Tab>
          <Tabs.Tab value="export">Export</Tabs.Tab>
          <Tabs.Tab value="archive">Archive</Tabs.Tab>
          <Tabs.Tab value="removed">Removed</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general" pt="md">
          <Stack>
            <Card withBorder>
              <Stack>
                <Text fw={600}>Financial configurations</Text>
                <Group grow>
                  <Select
                    label="Default currency"
                    data={[ 'USD', 'EUR', 'GBP' ]}
                    value={settings.currency}
                    onChange={(v) => setCurrency(v || settings.currency)}
                    allowDeselect={false}
                  />
                </Group>
                <NumberInput
                  label="Grace period (days)"
                  description="Days after the due date before an invoice is considered late."
                  value={settings.gracePeriodDays}
                  onChange={(v) => setGracePeriodDays(Number(v) || 0)}
                  min={0}
                  step={1}
                />
              </Stack>
            </Card>

            <Card withBorder>
              <Stack>
                <Text fw={600}>Tax compliance</Text>
                <Checkbox
                  label="Auto-apply enabled taxes to new invoices"
                  description="Applies all enabled taxes by default; you can remove them per invoice."
                  checked={settings.enforceTax}
                  onChange={(e) => setEnforceTax(e.currentTarget.checked)}
                />
              </Stack>
            </Card>

            <Card withBorder>
              <Stack>
                <Text fw={600}>Third parties</Text>
                <Text size="sm" c="dimmed">QuickBooks connection (for exports)</Text>
                {/* Placeholder fields for QuickBooks realm/company setup */}
                {/* In a real integration, this would drive OAuth; here we store realm/company ID */}
                <TextInput label="QuickBooks Company ID (Realm ID)" placeholder="e.g., 123145678901234" value={(settings as any).quickbooks?.companyId || ''} onChange={(e) => setQuickBooksCompanyId(e.currentTarget.value)} />
                <Checkbox label="Enable QuickBooks exports" checked={(settings as any).quickbooks?.enabled ?? false} onChange={(e) => setQuickBooksEnabled(e.currentTarget.checked)} />
              </Stack>
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="export" pt="md">
          <Card withBorder>
            <ExportPanel />
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="taxes" pt="md">
          <Card withBorder>
            <Group justify="space-between" mb="xs">
              <Text fw={600}>Tax rates</Text>
              <Button onClick={() => { setTaxName(''); setTaxRate(''); setTaxOpen(true); }}>Add tax</Button>
            </Group>
            <Table verticalSpacing="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Rate</Table.Th>
                  <Table.Th>Enabled</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {settings.taxes.filter((t) => !t.isArchived && !t.deletedAt).map((t) => (
                  <Table.Tr key={t.id}>
                    <Table.Td>{t.name}</Table.Td>
                    <Table.Td>{t.rate}%</Table.Td>
                    <Table.Td>
                      <Checkbox checked={t.enabled} onChange={(e) => updateTax(t.id, { enabled: e.currentTarget.checked })} />
                    </Table.Td>
                    <Table.Td>
                      <Group justify="flex-end" gap={6}>
                      <Button size="xs" variant="light" onClick={() => { setTaxName(t.name); setTaxRate(t.rate); setEditingTaxId(t.id); setTaxOpen(true); }}>Edit</Button>
                        <Button size="xs" variant="light" color="orange" onClick={() => archiveTax(t.id)}>Archive</Button>
                        <Button size="xs" variant="subtle" color="red" onClick={() => removeTax(t.id)}>Remove</Button>
                      </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
                {settings.taxes.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={4}><Text c="dimmed">No tax rates</Text></Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="templates" pt="md">
          <Card withBorder>
            <Group justify="space-between" mb="xs">
              <Text fw={600}>Templates</Text>
              <Button component={require('next/link').default as any} href="/employee/finance/templates/new" variant="light">New template</Button>
            </Group>
            <Stack>
              {settings.templates.filter((tpl) => !tpl.isArchived && !tpl.deletedAt).map((tpl) => (
                <Card withBorder key={tpl.id}>
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Text fw={600}>{tpl.name}</Text>
                      <Text size="sm" c="dimmed">Items: {tpl.items.length} · Taxes: {tpl.taxIds.length}</Text>
                    </div>
                    <Group gap={6}>
                      <Button size="xs" variant="light" onClick={() => {
                        setTplName(tpl.name);
                        setTplItems(tpl.items.map((it) => ({ id: `row-${Math.random()}`, description: it.description, quantity: String(it.quantity), unitPrice: String(it.unitPrice) })));
                        setTplTaxIds(tpl.taxIds);
                        setEditingTplId(tpl.id);
                        setTplOpen(true);
                      }}>Edit</Button>
                      <Button size="xs" variant="light" color="orange" onClick={() => archiveTemplate(tpl.id)}>Archive</Button>
                      <Button size="xs" variant="subtle" color="red" onClick={() => removeTemplate(tpl.id)}>Remove</Button>
                    </Group>
                  </Group>
                </Card>
              ))}
              {settings.templates.length === 0 && <Card withBorder><Text c="dimmed">No templates</Text></Card>}
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="products" pt="md">
          <Card withBorder>
            <Group justify="space-between" mb="xs">
              <Text fw={600}>Products (Stripe model)</Text>
              <Button component={require('next/link').default as any} href="/employee/finance/products/new" variant="light">New product</Button>
            </Group>
            <Group mb="sm">
              <SegmentedControl
                value={prodView}
                onChange={(v: any) => setProdView(v)}
                data={[
                  { label: 'All', value: 'all' },
                  { label: 'One-time', value: 'one_time' },
                  { label: 'Recurring', value: 'recurring' },
                  { label: 'Mixed', value: 'mixed' },
                ]}
              />
            </Group>
            <Card withBorder>
              <Table verticalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Prices</Table.Th>
                    <Table.Th>Description</Table.Th>
                    <Table.Th></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredProducts.map((p) => {
                    const hasOne = Array.isArray(p.prices) && p.prices.some((pr: any) => pr.type === 'one_time');
                    const hasRec = Array.isArray(p.prices) && p.prices.some((pr: any) => pr.type === 'recurring');
                    const kind = hasOne && hasRec ? 'Mixed' : hasRec ? 'Recurring' : hasOne ? 'One-time' : '—';
                    const onePrices = (p.prices || []).filter((pr: any) => pr.type === 'one_time');
                    const recPrices = (p.prices || []).filter((pr: any) => pr.type === 'recurring');
                    const fmtMoney = (pr: any) => `${pr.currency} ${Number(pr.unitAmount).toFixed(2)}`;
                    const fmtRec = (pr: any) => {
                      const n = pr.recurring?.intervalCount || 1;
                      const interval = pr.recurring?.interval || 'month';
                      return `${pr.currency} ${Number(pr.unitAmount).toFixed(2)}/${n > 1 ? `${n} ` : ''}${interval}${n > 1 ? 's' : ''}`;
                    };
                    if (p.deletedAt) return null;
                    return (
                      <Table.Tr key={p.id}>
                        <Table.Td>{p.name}</Table.Td>
                        <Table.Td><Badge variant="light" color={p.active ? 'green' : 'gray'}>{p.active ? 'Active' : 'Inactive'}</Badge></Table.Td>
                        <Table.Td>
                          <Text>{kind}</Text>
                        </Table.Td>
                        <Table.Td>
                          {onePrices.length > 0 && (
                            <Text size="sm">One-time: {onePrices.map(fmtMoney).join(', ')}</Text>
                          )}
                          {recPrices.length > 0 && (
                            <Text size="sm">Recurring: {recPrices.map(fmtRec).join(', ')}</Text>
                          )}
                          {onePrices.length === 0 && recPrices.length === 0 && <Text c="dimmed" size="sm">—</Text>}
                        </Table.Td>
                        <Table.Td><Text c="dimmed" size="sm">{p.description || '—'}</Text></Table.Td>
                        <Table.Td style={{ width: 1 }}>
                          <Menu shadow="md" width={180}>
                            <Menu.Target>
                              <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item onClick={() => { setProdIdEditing(p.id); setProdName(p.name); setProdDesc(p.description || ''); setProdOpen(true); }}>Edit</Menu.Item>
                              <Menu.Item onClick={() => { setPriceProdId(p.id); setPriceIdEditing(null); setPriceCurrency(settings.currency); setPriceAmount(''); setPriceType((p.defaultType || 'one_time') as any); setPriceInterval('month'); setPriceIntervalCount('1'); setPriceOpen(true); }}>Add price</Menu.Item>
                              <Menu.Item color="orange" onClick={() => archiveProduct(p.id)}>Archive</Menu.Item>
                              <Menu.Item color="red" onClick={() => removeProduct(p.id)}>Remove</Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={6}><Text c="dimmed">No products</Text></Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Card>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="archive" pt="md">
          <Card withBorder>
            <Tabs defaultValue="products">
              <Tabs.List>
                <Tabs.Tab value="products">Products</Tabs.Tab>
                <Tabs.Tab value="taxes">Taxes</Tabs.Tab>
                <Tabs.Tab value="templates">Templates</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="products" pt="md">
                <Table verticalSpacing="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Description</Table.Th>
                      <Table.Th></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                  {products.filter((p: any) => p.isArchived && !p.deletedAt).map((p) => (
                      <Table.Tr key={p.id}>
                        <Table.Td>{p.name}</Table.Td>
                        <Table.Td><Text c="dimmed" size="sm">{p.description || '—'}</Text></Table.Td>
                      <Table.Td style={{ width: 1 }}>
                        <Menu shadow="md" width={180}>
                          <Menu.Target>
                            <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item onClick={() => restoreProduct(p.id)}>Restore</Menu.Item>
                            <Menu.Item color="red" onClick={() => removeProduct(p.id)}>Remove</Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                      </Table.Tr>
                    ))}
                  {products.filter((p: any) => p.isArchived && !p.deletedAt).length === 0 && (
                      <Table.Tr>
                        <Table.Td colSpan={3}><Text c="dimmed">No archived products</Text></Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Tabs.Panel>

              <Tabs.Panel value="taxes" pt="md">
                <Table verticalSpacing="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Rate</Table.Th>
                      <Table.Th></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                  {settings.taxes.filter((t) => t.isArchived && !t.deletedAt).map((t) => (
                      <Table.Tr key={t.id}>
                        <Table.Td>{t.name}</Table.Td>
                        <Table.Td>{t.rate}%</Table.Td>
                      <Table.Td style={{ width: 1 }}>
                        <Menu shadow="md" width={180}>
                          <Menu.Target>
                            <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item onClick={() => restoreTax(t.id)}>Restore</Menu.Item>
                            <Menu.Item color="red" onClick={() => removeTax(t.id)}>Remove</Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                      </Table.Tr>
                    ))}
                  {settings.taxes.filter((t) => t.isArchived && !t.deletedAt).length === 0 && (
                      <Table.Tr>
                        <Table.Td colSpan={3}><Text c="dimmed">No archived taxes</Text></Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Tabs.Panel>

              <Tabs.Panel value="templates" pt="md">
                <Table verticalSpacing="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Items</Table.Th>
                      <Table.Th></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                  {settings.templates.filter((t) => t.isArchived && !t.deletedAt).map((t) => (
                      <Table.Tr key={t.id}>
                        <Table.Td>{t.name}</Table.Td>
                        <Table.Td>{t.items.length}</Table.Td>
                      <Table.Td style={{ width: 1 }}>
                        <Menu shadow="md" width={180}>
                          <Menu.Target>
                            <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item onClick={() => restoreTemplate(t.id)}>Restore</Menu.Item>
                            <Menu.Item color="red" onClick={() => removeTemplate(t.id)}>Remove</Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                      </Table.Tr>
                    ))}
                  {settings.templates.filter((t) => t.isArchived && !t.deletedAt).length === 0 && (
                      <Table.Tr>
                        <Table.Td colSpan={3}><Text c="dimmed">No archived templates</Text></Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Tabs.Panel>
            </Tabs>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="removed" pt="md">
          <Card withBorder>
            <Tabs defaultValue="products">
              <Tabs.List>
                <Tabs.Tab value="products">Products</Tabs.Tab>
                <Tabs.Tab value="taxes">Taxes</Tabs.Tab>
                <Tabs.Tab value="templates">Templates</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="products" pt="md">
                <Table verticalSpacing="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Description</Table.Th>
                      <Table.Th></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {products.filter((p: any) => !!p.deletedAt).map((p) => (
                      <Table.Tr key={p.id}>
                        <Table.Td>{p.name}</Table.Td>
                        <Table.Td><Text c="dimmed" size="sm">{p.description || '—'}</Text></Table.Td>
                      <Table.Td style={{ width: 1 }}>
                        <Menu shadow="md" width={220}>
                          <Menu.Target>
                            <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item onClick={() => updateProduct(p.id, { deletedAt: undefined } as any)}>Restore</Menu.Item>
                            <Menu.Item color="red" onClick={() => (useFinanceStore.getState() as any).purgeProduct?.(p.id)}>Delete permanently</Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                      </Table.Tr>
                    ))}
                    {products.filter((p: any) => !!p.deletedAt).length === 0 && (
                      <Table.Tr>
                        <Table.Td colSpan={3}><Text c="dimmed">No removed products</Text></Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Tabs.Panel>

              <Tabs.Panel value="taxes" pt="md">
                <Table verticalSpacing="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Rate</Table.Th>
                      <Table.Th></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {settings.taxes.filter((t) => !!t.deletedAt).map((t) => (
                      <Table.Tr key={t.id}>
                        <Table.Td>{t.name}</Table.Td>
                        <Table.Td>{t.rate}%</Table.Td>
                      <Table.Td style={{ width: 1 }}>
                        <Menu shadow="md" width={220}>
                          <Menu.Target>
                            <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item onClick={() => updateTax(t.id, { deletedAt: undefined } as any)}>Restore</Menu.Item>
                            <Menu.Item color="red" onClick={() => (useFinanceStore.getState() as any).purgeTax?.(t.id)}>Delete permanently</Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                      </Table.Tr>
                    ))}
                    {settings.taxes.filter((t) => !!t.deletedAt).length === 0 && (
                      <Table.Tr>
                        <Table.Td colSpan={3}><Text c="dimmed">No removed taxes</Text></Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Tabs.Panel>

              <Tabs.Panel value="templates" pt="md">
                <Table verticalSpacing="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Items</Table.Th>
                      <Table.Th></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {settings.templates.filter((t) => !!t.deletedAt).map((t) => (
                      <Table.Tr key={t.id}>
                        <Table.Td>{t.name}</Table.Td>
                        <Table.Td>{t.items.length}</Table.Td>
                      <Table.Td style={{ width: 1 }}>
                        <Menu shadow="md" width={220}>
                          <Menu.Target>
                            <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item onClick={() => updateTemplate(t.id, { deletedAt: undefined } as any)}>Restore</Menu.Item>
                            <Menu.Item color="red" onClick={() => (useFinanceStore.getState() as any).purgeTemplate?.(t.id)}>Delete permanently</Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                      </Table.Tr>
                    ))}
                    {settings.templates.filter((t) => !!t.deletedAt).length === 0 && (
                      <Table.Tr>
                        <Table.Td colSpan={3}><Text c="dimmed">No removed templates</Text></Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Tabs.Panel>
            </Tabs>
          </Card>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={taxOpen} onClose={() => { setTaxOpen(false); setEditingTaxId(null); }} title={editingTaxId ? 'Edit tax' : 'Add tax'} centered>
        <Stack>
          <TextInput label="Tax name" placeholder="VAT" value={taxName} onChange={(e) => setTaxName(e.currentTarget.value)} />
          <NumberInput label="Rate (%)" value={taxRate as any} onChange={setTaxRate as any} min={0} step={0.01} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => { setTaxOpen(false); setEditingTaxId(null); }}>Cancel</Button>
            <Button onClick={() => {
              const id = editingTaxId as string | undefined;
              const rateNum = Number(taxRate) || 0;
              if (id) updateTax(id, { name: taxName, rate: rateNum }); else addTax({ name: taxName, rate: rateNum });
              setTaxOpen(false); setEditingTaxId(null);
            }}>Save</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={tplOpen} onClose={() => { setTplOpen(false); setEditingTplId(null); }} title={editingTplId ? 'Edit template' : 'New template'} size="lg" centered>
        <Stack>
          <TextInput label="Template name" placeholder="Consulting invoice" value={tplName} onChange={(e) => setTplName(e.currentTarget.value)} />
          <Text fw={600}>Items</Text>
          <Table verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Description</Table.Th>
                <Table.Th style={{ width: 120 }}>Qty</Table.Th>
                <Table.Th style={{ width: 160 }}>Unit price</Table.Th>
                <Table.Th style={{ width: 1 }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {tplItems.map((r) => (
                <Table.Tr key={r.id}>
                  <Table.Td><TextInput value={r.description} onChange={(e) => updateTplRow(r.id, { description: e.currentTarget.value })} placeholder="Description" /></Table.Td>
                  <Table.Td>
                    <NumberInput value={r.quantity as any} onChange={(v: any) => updateTplRow(r.id, { quantity: String(v ?? '1') })} min={1} step={1} />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput value={r.unitPrice as any} onChange={(v: any) => updateTplRow(r.id, { unitPrice: String(v ?? '0') })} min={0} step={0.01} />
                  </Table.Td>
                  <Table.Td><Button size="xs" variant="subtle" color="red" onClick={() => removeTplRow(r.id)}>Remove</Button></Table.Td>
                </Table.Tr>
              ))}
              {tplItems.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={4}><Text c="dimmed">No items yet</Text></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
          <Button variant="light" onClick={addTplRow}>Add item</Button>
          <Button variant="light" onClick={() => {
            // Simple picker via prompt chain for MVP
            const prodName = prompt('Product name to add (matches first)');
            if (!prodName) return;
            const prod = products.find((p) => (p.name || '').toLowerCase().includes(prodName.toLowerCase()));
            if (!prod) return alert('No matching product');
            if (!prod.prices.length) return alert('Product has no prices');
            const price = prod.prices[0];
            setTplItems((rows) => [...rows, { id: `row-${Date.now()}`, description: `${prod.name}`, quantity: '1', unitPrice: String(price.unitAmount) }]);
          }}>Add from product (quick)</Button>
          <MultiSelect label="Taxes" data={taxOptions} value={tplTaxIds} onChange={setTplTaxIds} searchable placeholder="Select taxes to apply" />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => { setTplOpen(false); setEditingTplId(null); }}>Cancel</Button>
            <Button onClick={() => {
              const id = editingTplId as string | undefined;
              const items = tplItems.map((r) => ({ description: r.description, quantity: Number(r.quantity) || 0, unitPrice: Number(r.unitPrice) || 0 }));
              if (id) updateTemplate(id, { name: tplName, items, taxIds: tplTaxIds }); else addTemplate({ name: tplName, items, taxIds: tplTaxIds });
              setTplOpen(false); setEditingTplId(null);
            }}>Save</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={prodOpen} onClose={() => { setProdOpen(false); setProdIdEditing(null); }} title={prodIdEditing ? 'Edit product' : 'New product'} centered>
        <Stack>
          <TextInput label="Name" value={prodName} onChange={(e) => setProdName(e.currentTarget.value)} />
          <TextInput label="Description" value={prodDesc} onChange={(e) => setProdDesc(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => { setProdOpen(false); setProdIdEditing(null); }}>Cancel</Button>
            <Button onClick={() => {
              if (!prodName.trim()) return;
              if (prodIdEditing) updateProduct(prodIdEditing, { name: prodName.trim(), description: prodDesc.trim() || undefined });
              else addProduct({ name: prodName.trim(), description: prodDesc.trim() || undefined });
              setProdOpen(false); setProdIdEditing(null);
            }}>Save</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={priceOpen} onClose={() => { setPriceOpen(false); setPriceProdId(null); setPriceIdEditing(null); }} title={priceIdEditing ? 'Edit price' : 'Add price'} centered>
        <Stack>
          <Group grow>
            <Select label="Type" data={[ { value: 'one_time', label: 'One-time' }, { value: 'recurring', label: 'Recurring' } ]} value={priceType} onChange={(v: any) => setPriceType(v)} />
            <Select label="Currency" data={[ 'USD', 'EUR', 'GBP' ]} value={priceCurrency} onChange={(v) => setPriceCurrency(v || 'USD')} allowDeselect={false} />
            <NumberInput label="Amount" value={priceAmount as any} onChange={setPriceAmount as any} min={0} step={0.01} prefix={priceCurrency + ' '} />
          </Group>
          {priceType === 'recurring' && (
            <Group grow>
              <Select label="Interval" data={[ 'day', 'week', 'month', 'year' ]} value={priceInterval} onChange={(v: any) => setPriceInterval(v)} />
              <NumberInput label="Interval count" value={priceIntervalCount as any} onChange={setPriceIntervalCount as any} min={1} step={1} />
            </Group>
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => { setPriceOpen(false); setPriceProdId(null); setPriceIdEditing(null); }}>Cancel</Button>
            <Button onClick={() => {
              if (!priceProdId) return;
              const payload: any = { currency: priceCurrency, unitAmount: Number(priceAmount) || 0, type: priceType as any };
              if (priceType === 'recurring') payload.recurring = { interval: priceInterval, intervalCount: Number(priceIntervalCount) || 1 };
              if (priceIdEditing) updatePriceOnProduct(priceProdId, priceIdEditing, payload); else addPriceToProduct(priceProdId, payload);
              setPriceOpen(false); setPriceProdId(null); setPriceIdEditing(null);
            }}>Save</Button>
          </Group>
        </Stack>
      </Modal>
    </EmployerAuthGate>
  );
}

function ExportPanel() {
  const invoices = useFinanceStore((s) => s.invoices);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [dataset, setDataset] = useState<'invoices'>('invoices');
  return (
    <Stack>
      <Text fw={600}>Export to QuickBooks</Text>
      <Text size="sm" c="dimmed">Choose a date range and dataset to export. Requires QuickBooks setup in General → Third parties.</Text>
      <Group grow>
        <TextInput type="date" label="Start date" value={start} onChange={(e) => setStart(e.currentTarget.value)} />
        <TextInput type="date" label="End date" value={end} onChange={(e) => setEnd(e.currentTarget.value)} />
      </Group>
      <Select label="Dataset" data={[ { value: 'invoices', label: 'Invoices' } ]} value={dataset} onChange={(v: any) => setDataset(v || 'invoices')} />
      <Group justify="flex-end">
        <Button variant="light" onClick={() => {
          const s = start ? new Date(start) : null; const e = end ? new Date(end) : null;
          const rows = invoices.filter((i) => {
            const d = new Date(i.issuedAt);
            if (s && d < s) return false;
            if (e && d > e) return false;
            return true;
          }).map((i) => ({ id: i.id, customerId: i.customerId, amount: i.amount, currency: i.currency, dueDate: i.dueDate, status: i.status, issuedAt: new Date(i.issuedAt).toISOString() }));
          const header = 'id,customerId,amount,currency,dueDate,status,issuedAt\n';
          const body = rows.map((r) => `${r.id},${r.customerId},${r.amount},${r.currency},${r.dueDate},${r.status},${r.issuedAt}`).join('\n');
          const csv = header + body;
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = `export-${dataset}.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        }}>Generate CSV</Button>
        <Button onClick={() => {
          alert('QuickBooks export initiated (stub). Configure QuickBooks in General → Third parties.');
        }}>Export to QuickBooks</Button>
      </Group>
    </Stack>
  );
}
