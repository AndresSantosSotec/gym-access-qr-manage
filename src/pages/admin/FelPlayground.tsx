import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Terminal,
  MagnifyingGlass,
  FileText,
  CheckCircle,
  XCircle,
  Download,
  Info,
  Play,
  Article,
  BracketsCurly,
  Trash,
} from '@phosphor-icons/react';
import { receiptsService } from '@/services/receipts.service';
import { toast } from 'sonner';

interface SoapLog {
  requestRaw?: string;
  responseRaw?: string;
  parsed?: any;
}

export function FelPlayground() {
  const [felStatus, setFelStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Consultas básicas state
  const [nitQuery, setNitQuery] = useState('6407846');
  const [cuiQuery, setCuiQuery] = useState('2879007111601');
  const [phrasesQuery, setPhrasesQuery] = useState('800000001026');
  const [estQuery, setEstQuery] = useState('800000001026');
  const [estId, setEstId] = useState('0');

  const [queryResult, setQueryResult] = useState<any>(null);
  const [querySoapLog, setQuerySoapLog] = useState<SoapLog>({});
  const [queryLoading, setQueryLoading] = useState(false);

  // Certificación XML DTE state
  const [samples, setSamples] = useState<any[]>([]);
  const [selectedSample, setSelectedSample] = useState('');
  const [xmlContent, setXmlContent] = useState('');
  const [certLoading, setCertLoading] = useState(false);
  const [certResult, setCertResult] = useState<any>(null);
  const [certSoapLog, setCertSoapLog] = useState<SoapLog>({});

  // Consultas por GUID / Rango / PDF state
  const [guidQuery, setGuidQuery] = useState('');
  const [guidLoading, setGuidLoading] = useState(false);
  const [guidResult, setGuidResult] = useState<any>(null);
  const [guidSoapLog, setGuidSoapLog] = useState<SoapLog>({});

  const [rangeFrom, setRangeFrom] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [rangeTo, setRangeTo] = useState(new Date().toISOString().slice(0, 10));
  const [rangeBuyerNit, setRangeBuyerNit] = useState('');
  const [rangeLoading, setRangeLoading] = useState(false);
  const [rangeResult, setRangeResult] = useState<any>(null);
  const [rangeSoapLog, setRangeSoapLog] = useState<SoapLog>({});

  const [pdfGuid, setPdfGuid] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfResult, setPdfResult] = useState<any>(null);
  const [pdfSoapLog, setPdfSoapLog] = useState<SoapLog>({});

  // Anulación state
  const [voidGuid, setVoidGuid] = useState('');
  const [voidReceptor, setVoidReceptor] = useState('109205812');
  const [voidEmissionDate, setVoidEmissionDate] = useState(new Date().toISOString().slice(0, 19)); // Y-m-dTH:i:s
  const [voidMotivo, setVoidMotivo] = useState('Anulación de prueba FEL');
  const [voidLoading, setVoidLoading] = useState(false);
  const [voidResult, setVoidResult] = useState<any>(null);
  const [voidSoapLog, setVoidSoapLog] = useState<SoapLog>({});

  useEffect(() => {
    loadFelStatus();
    loadSamples();
  }, []);

  const loadFelStatus = async () => {
    try {
      setLoadingStatus(true);
      const data = await receiptsService.getFelStatus();
      setFelStatus(data);
    } catch (err) {
      toast.error('Error cargando configuración FEL');
    } finally {
      setLoadingStatus(false);
    }
  };

  const loadSamples = async () => {
    try {
      const data = await receiptsService.getSamples();
      if (data.success) {
        setSamples(data.samples);
        if (data.samples.length > 0) {
          handleSelectSample(data.samples[0].path);
        }
      }
    } catch (err) {
      console.warn('No se pudieron cargar los archivos XML de ejemplo');
    }
  };

  const handleSelectSample = async (samplePath: string) => {
    setSelectedSample(samplePath);
    const [category, filename] = samplePath.split('/');
    try {
      const data = await receiptsService.getSampleContent(category, filename);
      if (data.success) {
        setXmlContent(data.content);
      }
    } catch (err) {
      toast.error('Error cargando contenido del XML de ejemplo');
    }
  };

  // SOAP response parser format helpers
  const formatXml = (xml: string) => {
    if (!xml) return '';
    let formatted = '';
    let reg = /(>)(<)(\/*)/g;
    xml = xml.replace(reg, '$1\r\n$2$3');
    let pad = 0;
    xml.split('\r\n').forEach((node) => {
      let indent = 0;
      if (node.match(/.+<\/\w[^>]*>$/)) {
        indent = 0;
      } else if (node.match(/^<\/\w/)) {
        if (pad !== 0) {
          pad -= 1;
        }
      } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
        indent = 1;
      } else {
        indent = 0;
      }
      let padding = '';
      for (let i = 0; i < pad; i++) {
        padding += '  ';
      }
      formatted += padding + node + '\r\n';
      pad += indent;
    });
    return formatted.trim();
  };

  const formatJson = (obj: any) => {
    if (!obj) return '';
    return JSON.stringify(obj, null, 2);
  };

  const handleConsultNit = async () => {
    setQueryLoading(true);
    setQueryResult(null);
    setQuerySoapLog({});
    try {
      const data = await receiptsService.consultNit(nitQuery);
      setQueryResult(data);
      toast.success('Consulta de NIT completada');
    } catch (err: any) {
      setQueryResult(err.response?.data || { error: err.message });
      toast.error('Fallo la consulta de NIT');
    } finally {
      setQueryLoading(false);
    }
  };

  const handleConsultCui = async () => {
    setQueryLoading(true);
    setQueryResult(null);
    setQuerySoapLog({});
    try {
      const data = await receiptsService.consultCui(cuiQuery);
      setQueryResult(data.parsed?.data1_decoded || data.parsed?.data2_json || data);
      setQuerySoapLog({
        requestRaw: data.request_raw,
        responseRaw: data.raw,
        parsed: data.parsed,
      });
      if (data.success) {
        toast.success('Consulta de CUI completada');
      } else {
        toast.error(data.error || 'Error al consultar CUI');
      }
    } catch (err: any) {
      setQueryResult(err.response?.data || { error: err.message });
      toast.error('Fallo la consulta de CUI');
    } finally {
      setQueryLoading(false);
    }
  };

  const handleConsultPhrases = async () => {
    setQueryLoading(true);
    setQueryResult(null);
    setQuerySoapLog({});
    try {
      const data = await receiptsService.consultPhrases(phrasesQuery);
      setQueryResult(data.parsed?.data1_json || data.parsed?.data2_json || data);
      setQuerySoapLog({
        requestRaw: data.request_raw,
        responseRaw: data.raw,
        parsed: data.parsed,
      });
      if (data.success) {
        toast.success('Consulta de Frases completada');
      } else {
        toast.error(data.error || 'Error al consultar Frases');
      }
    } catch (err: any) {
      setQueryResult(err.response?.data || { error: err.message });
      toast.error('Fallo la consulta de Frases');
    } finally {
      setQueryLoading(false);
    }
  };

  const handleConsultEstablishments = async () => {
    setQueryLoading(true);
    setQueryResult(null);
    setQuerySoapLog({});
    try {
      const data = await receiptsService.consultEstablishments(estQuery, estId);
      setQueryResult(data.parsed?.data1_json || data.parsed?.data2_json || data);
      setQuerySoapLog({
        requestRaw: data.request_raw,
        responseRaw: data.raw,
        parsed: data.parsed,
      });
      if (data.success) {
        toast.success('Consulta de Establecimientos completada');
      } else {
        toast.error(data.error || 'Error al consultar Establecimientos');
      }
    } catch (err: any) {
      setQueryResult(err.response?.data || { error: err.message });
      toast.error('Fallo la consulta de Establecimientos');
    } finally {
      setQueryLoading(false);
    }
  };

  const handleCertifyXml = async () => {
    if (!xmlContent.trim()) {
      toast.error('El contenido XML no puede estar vacío');
      return;
    }
    setCertLoading(true);
    setCertResult(null);
    setCertSoapLog({});
    try {
      const data = await receiptsService.certifyRawXml(xmlContent);
      setCertResult(data);
      setCertSoapLog({
        requestRaw: data.request_raw,
        responseRaw: data.raw,
        parsed: data.parsed,
      });
      if (data.success) {
        toast.success('DTE Certificado Exitosamente');
        // Pre-fill GUID in other fields for easy testing
        const newGuid = data.parsed?.document_guid || data.parsed?.data2_json?.uuid || '';
        if (newGuid) {
          setGuidQuery(newGuid);
          setPdfGuid(newGuid);
          setVoidGuid(newGuid);
        }
      } else {
        toast.error(data.error || 'Error al certificar documento');
      }
    } catch (err: any) {
      setCertResult(err.response?.data || { error: err.message });
      toast.error('Fallo la certificación del XML');
    } finally {
      setCertLoading(false);
    }
  };

  const handleQueryGuid = async () => {
    if (!guidQuery.trim()) {
      toast.error('Debe ingresar un GUID válido');
      return;
    }
    setGuidLoading(true);
    setGuidResult(null);
    setGuidSoapLog({});
    try {
      const data = await receiptsService.queryGuid(guidQuery);
      setGuidResult(data);
      setGuidSoapLog({
        requestRaw: data.request_raw,
        responseRaw: data.raw,
        parsed: data.parsed,
      });
      if (data.success) {
        toast.success('Información de DTE recuperada');
      } else {
        toast.error(data.error || 'Error al consultar DTE');
      }
    } catch (err: any) {
      setGuidResult(err.response?.data || { error: err.message });
      toast.error('Fallo la consulta del DTE');
    } finally {
      setGuidLoading(false);
    }
  };

  const handleQueryDateRange = async () => {
    setRangeLoading(true);
    setRangeResult(null);
    setRangeSoapLog({});
    try {
      const data = await receiptsService.queryDateRange({
        date_from: rangeFrom,
        date_to: rangeTo,
        buyer_nit: rangeBuyerNit || undefined,
      });
      setRangeResult(data);
      setRangeSoapLog({
        requestRaw: data.request_raw,
        responseRaw: data.raw,
        parsed: data.parsed,
      });
      if (data.success) {
        toast.success('Consulta de rango completada');
      } else {
        toast.error(data.error || 'Error al consultar rango');
      }
    } catch (err: any) {
      setRangeResult(err.response?.data || { error: err.message });
      toast.error('Fallo la consulta por rango');
    } finally {
      setRangeLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!pdfGuid.trim()) {
      toast.error('Debe ingresar un GUID válido');
      return;
    }
    setPdfLoading(true);
    setPdfResult(null);
    setPdfSoapLog({});
    try {
      const data = await receiptsService.getPdfByGuid(pdfGuid);
      setPdfResult(data);
      setPdfSoapLog({
        requestRaw: data.request_raw,
        responseRaw: data.raw,
        parsed: data.parsed,
      });

      if (data.success) {
        const base64 = [data.parsed?.data3, data.parsed?.data2, data.parsed?.data1].find((v) => {
          if (!v || typeof v !== 'string') return false;
          try {
            const head = window.atob(v.slice(0, 24));
            return head.startsWith('%PDF');
          } catch {
            return false;
          }
        });

        if (base64) {
          const binaryString = window.atob(base64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `fel-${pdfGuid.toUpperCase()}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          toast.success('PDF descargado correctamente');
        } else {
          toast.error(data.error || 'El DTE no tiene un PDF disponible');
        }
      } else {
        toast.error(data.error || 'El DTE no tiene un PDF disponible');
      }
    } catch (err: any) {
      setPdfResult(err.response?.data || { error: err.message });
      toast.error('Fallo la descarga del PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleVoidByGuid = async () => {
    if (!voidGuid.trim()) {
      toast.error('Debe ingresar el GUID a anular');
      return;
    }
    if (!confirm('¿Está seguro de que desea anular este documento FEL en el entorno de pruebas?')) return;

    setVoidLoading(true);
    setVoidResult(null);
    setVoidSoapLog({});
    try {
      const data = await receiptsService.voidByGuid({
        guid: voidGuid,
        receptor_id: voidReceptor,
        fecha_emision: voidEmissionDate,
        motivo: voidMotivo,
      });
      setVoidResult(data);
      setVoidSoapLog({
        requestRaw: data.request_raw,
        responseRaw: data.raw,
        parsed: data.parsed,
      });

      if (data.success) {
        toast.success('Documento FEL anulado exitosamente');
      } else {
        toast.error(data.error || 'Error al anular documento');
      }
    } catch (err: any) {
      setVoidResult(err.response?.data || { error: err.message });
      toast.error('Fallo la anulación del documento');
    } finally {
      setVoidLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-border/80">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
            FEL Playground
          </h1>
          <p className="text-muted-foreground mt-1">
            Consola interactiva de diagnóstico y validación de Facturación Electrónica SAT (Guatemala).
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" onClick={loadFelStatus} disabled={loadingStatus}>
            Cargar Configuración
          </Button>
          {felStatus && (
            <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold">
              <span className={`w-2 h-2 rounded-full ${felStatus.use_test ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
              {felStatus.use_test ? 'Entorno de Pruebas' : 'Producción'}
            </Badge>
          )}
        </div>
      </div>

      {/* Info Status Cards */}
      {felStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-sm border-border/40">
            <CardHeader className="py-3">
              <CardDescription className="text-xs">Proveedor</CardDescription>
              <CardTitle className="text-lg font-bold text-foreground capitalize">{felStatus.provider}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-sm border-border/40">
            <CardHeader className="py-3">
              <CardDescription className="text-xs">NIT Contribuyente</CardDescription>
              <CardTitle className="text-lg font-mono font-bold text-primary">{felStatus.entity_nit || 'No configurado'}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-sm border-border/40">
            <CardHeader className="py-3">
              <CardDescription className="text-xs">Certificación Automática Efectivo</CardDescription>
              <CardTitle className="text-lg font-bold">
                <Badge variant={felStatus.auto_certify_cash ? 'default' : 'outline'}>
                  {felStatus.auto_certify_cash ? 'Sí' : 'No'}
                </Badge>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-sm border-border/40">
            <CardHeader className="py-3">
              <CardDescription className="text-xs">Certificación Automática Tarjeta/Otros</CardDescription>
              <CardTitle className="text-lg font-bold">
                <Badge variant={felStatus.auto_certify_non_cash ? 'default' : 'outline'}>
                  {felStatus.auto_certify_non_cash ? 'Sí' : 'No'}
                </Badge>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="consultas" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-1 p-1 bg-muted rounded-xl mb-6">
          <TabsTrigger value="consultas" className="rounded-lg py-2">Consultas Básicas</TabsTrigger>
          <TabsTrigger value="xml" className="rounded-lg py-2">Certificar XML</TabsTrigger>
          <TabsTrigger value="infodte" className="rounded-lg py-2">Consultas DTE</TabsTrigger>
          <TabsTrigger value="anular" className="rounded-lg py-2">Anulaciones</TabsTrigger>
        </TabsList>

        {/* ==================== TAB 1: CONSULTAS BASICAS ==================== */}
        <TabsContent value="consultas" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-4">
              <Card className="shadow-sm border-border/40">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MagnifyingGlass size={20} className="text-indigo-600" />
                    Consultar NIT
                  </CardTitle>
                  <CardDescription>Consulta NIT del cliente utilizando el API directo GetNIT.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="NIT del cliente..."
                      value={nitQuery}
                      onChange={(e) => setNitQuery(e.target.value)}
                    />
                    <Button onClick={handleConsultNit} disabled={queryLoading}>
                      {queryLoading ? 'Buscando...' : 'Consultar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border/40">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MagnifyingGlass size={20} className="text-indigo-600" />
                    Consultar CUI
                  </CardTitle>
                  <CardDescription>Consulta CUI/DPI a través del servicio SOAP (CONSULTA_CUI).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="CUI/DPI (13 dígitos)..."
                      value={cuiQuery}
                      onChange={(e) => setCuiQuery(e.target.value)}
                    />
                    <Button onClick={handleConsultCui} disabled={queryLoading}>
                      {queryLoading ? 'Buscando...' : 'Consultar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border/40">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Article size={20} className="text-indigo-600" />
                    Obtener Frases
                  </CardTitle>
                  <CardDescription>Consulta frases fiscales asociadas a un NIT (MINIRTUFRFASES_QUERY_JSON).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="NIT..."
                      value={phrasesQuery}
                      onChange={(e) => setPhrasesQuery(e.target.value)}
                    />
                    <Button onClick={handleConsultPhrases} disabled={queryLoading}>
                      {queryLoading ? 'Buscando...' : 'Consultar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border/40">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Terminal size={20} className="text-indigo-600" />
                    Obtener Establecimientos
                  </CardTitle>
                  <CardDescription>Lista establecimientos de un NIT (ESTABLECIMIENTO_QUERY_JSON).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Input
                      placeholder="NIT de la Empresa..."
                      value={estQuery}
                      onChange={(e) => setEstQuery(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="ID Establecimiento (default 0)..."
                        value={estId}
                        onChange={(e) => setEstId(e.target.value)}
                      />
                      <Button onClick={handleConsultEstablishments} disabled={queryLoading} className="w-full">
                        {queryLoading ? 'Buscando...' : 'Consultar'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Display */}
            <div className="lg:col-span-8 space-y-6">
              <Card className="shadow-md border-border/50 h-full flex flex-col">
                <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Resultados de Consulta</CardTitle>
                    <CardDescription>Visualiza las tramas SOAP y respuestas en JSON estructurado.</CardDescription>
                  </div>
                  {queryLoading && <Badge variant="outline" className="animate-pulse">Cargando...</Badge>}
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden flex flex-col min-h-[400px]">
                  {queryResult ? (
                    <Tabs defaultValue="parsed" className="w-full h-full flex flex-col">
                      <TabsList className="bg-muted/50 p-1 flex justify-start rounded-none border-b border-border/40">
                        <TabsTrigger value="parsed" className="px-4 py-2 text-xs flex items-center gap-1.5"><BracketsCurly size={14} />JSON Parseado</TabsTrigger>
                        {querySoapLog.requestRaw && (
                          <TabsTrigger value="soap_req" className="px-4 py-2 text-xs flex items-center gap-1.5"><FileText size={14} />SOAP Request</TabsTrigger>
                        )}
                        {querySoapLog.responseRaw && (
                          <TabsTrigger value="soap_res" className="px-4 py-2 text-xs flex items-center gap-1.5"><FileText size={14} />SOAP Response</TabsTrigger>
                        )}
                      </TabsList>
                      <TabsContent value="parsed" className="flex-1 p-4 overflow-auto bg-slate-950 font-mono text-xs text-indigo-300">
                        <pre>{formatJson(queryResult)}</pre>
                      </TabsContent>
                      <TabsContent value="soap_req" className="flex-1 p-4 overflow-auto bg-slate-950 font-mono text-xs text-indigo-300">
                        <pre>{formatXml(querySoapLog.requestRaw || '')}</pre>
                      </TabsContent>
                      <TabsContent value="soap_res" className="flex-1 p-4 overflow-auto bg-slate-950 font-mono text-xs text-indigo-300">
                        <pre>{formatXml(querySoapLog.responseRaw || '')}</pre>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                      <Info size={40} className="mb-2 text-muted-foreground/50" />
                      <p>Ejecute una de las consultas de la izquierda para ver los resultados.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ==================== TAB 2: CERTIFICACION XML ==================== */}
        <TabsContent value="xml" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              <Card className="shadow-sm border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText size={20} className="text-primary" />
                    Plantillas de Ejemplo DTE
                  </CardTitle>
                  <CardDescription>Cargue una de las plantillas provistas por SAT / Corpo Sistemas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Seleccionar Ejemplo</label>
                    <Select value={selectedSample} onValueChange={handleSelectSample}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una plantilla..." />
                      </SelectTrigger>
                      <SelectContent>
                        {samples.map((s) => (
                          <SelectItem key={s.path} value={s.path}>
                            [{s.category.toUpperCase()}] {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold block">XML de Entrada DTE</label>
                    <p className="text-xs text-muted-foreground mb-1">
                      Puede modificar cualquier dato (como NITs, montos, etc.) antes de certificar.
                    </p>
                    <textarea
                      value={xmlContent}
                      onChange={(e) => setXmlContent(e.target.value)}
                      className="w-full h-96 p-3 font-mono text-xs bg-slate-950 text-emerald-400 rounded-md border border-border/60 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <Button onClick={handleCertifyXml} disabled={certLoading} className="w-full flex items-center justify-center gap-2">
                    <Play size={16} />
                    {certLoading ? 'Certificando DTE...' : 'Certificar Documento DTE'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Certify Results Display */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="shadow-md border-border/50 h-full flex flex-col">
                <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Resultado de Certificación</CardTitle>
                    <CardDescription>Detalles devueltos por el certificador.</CardDescription>
                  </div>
                  {certResult && (
                    <Badge variant={certResult.success ? 'default' : 'destructive'} className="font-semibold">
                      {certResult.success ? 'Éxito: Certificado' : 'Error en Validación'}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden flex flex-col min-h-[400px]">
                  {certResult ? (
                    <div className="flex-1 flex flex-col h-full">
                      {/* Summary Banner */}
                      <div className={`p-4 border-b ${certResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        <div className="flex items-start gap-2.5">
                          {certResult.success ? (
                            <CheckCircle size={20} className="text-green-600 mt-0.5" />
                          ) : (
                            <XCircle size={20} className="text-red-600 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <h4 className="font-bold text-sm">
                              {certResult.success ? 'DTE Certificado Exitosamente' : 'Fallo en la Certificación'}
                            </h4>
                            {certResult.success ? (
                              <div className="mt-2 text-xs space-y-1 font-mono">
                                <div><span className="font-bold">GUID/UUID:</span> {certResult.parsed?.document_guid || certResult.parsed?.data2_json?.uuid}</div>
                                <div><span className="font-bold">Serie:</span> {certResult.parsed?.batch}</div>
                                <div><span className="font-bold">Número:</span> {certResult.parsed?.serial}</div>
                              </div>
                            ) : (
                              <p className="mt-1 text-xs">{certResult.error || 'Error desconocido del validador SAT.'}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Code Tabs */}
                      <Tabs defaultValue="parsed" className="w-full flex-1 flex flex-col">
                        <TabsList className="bg-muted/50 p-1 flex justify-start rounded-none border-b border-border/40">
                          <TabsTrigger value="parsed" className="px-4 py-2 text-xs flex items-center gap-1.5"><BracketsCurly size={14} />JSON Parseado</TabsTrigger>
                          <TabsTrigger value="soap_req" className="px-4 py-2 text-xs flex items-center gap-1.5"><FileText size={14} />SOAP Request</TabsTrigger>
                          <TabsTrigger value="soap_res" className="px-4 py-2 text-xs flex items-center gap-1.5"><FileText size={14} />SOAP Response</TabsTrigger>
                        </TabsList>
                        <TabsContent value="parsed" className="flex-1 p-4 overflow-auto bg-slate-950 font-mono text-xs text-indigo-300">
                          <pre>{formatJson(certResult)}</pre>
                        </TabsContent>
                        <TabsContent value="soap_req" className="flex-1 p-4 overflow-auto bg-slate-950 font-mono text-xs text-indigo-300">
                          <pre>{formatXml(certSoapLog.requestRaw || '')}</pre>
                        </TabsContent>
                        <TabsContent value="soap_res" className="flex-1 p-4 overflow-auto bg-slate-950 font-mono text-xs text-indigo-300">
                          <pre>{formatXml(certSoapLog.responseRaw || '')}</pre>
                        </TabsContent>
                      </Tabs>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                      <Info size={40} className="mb-2 text-muted-foreground/50" />
                      <p>Ingrese o modifique un XML de la izquierda y presione "Certificar" para ver los resultados.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ==================== TAB 3: CONSULTAS DTE ==================== */}
        <TabsContent value="infodte" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-6">
              {/* Query GUID Card */}
              <Card className="shadow-sm border-border/40">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MagnifyingGlass size={20} className="text-primary" />
                    Consultar DTE por GUID (GET_INFODTE)
                  </CardTitle>
                  <CardDescription>Obtiene la información registrada en el certificador usando el GUID.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ingrese el GUID del DTE..."
                      value={guidQuery}
                      onChange={(e) => setGuidQuery(e.target.value)}
                    />
                    <Button onClick={handleQueryGuid} disabled={guidLoading}>
                      {guidLoading ? 'Buscando...' : 'Consultar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Download PDF Card */}
              <Card className="shadow-sm border-border/40">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Download size={20} className="text-primary" />
                    Obtener PDF por GUID (GET_DOCUMENT)
                  </CardTitle>
                  <CardDescription>Descarga la representación gráfica oficial del DTE desde la SAT.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ingrese el GUID del DTE..."
                      value={pdfGuid}
                      onChange={(e) => setPdfGuid(e.target.value)}
                    />
                    <Button onClick={handleDownloadPdf} disabled={pdfLoading}>
                      {pdfLoading ? 'Descargando...' : 'Descargar PDF'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Date Range Card */}
              <Card className="shadow-sm border-border/40">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Terminal size={20} className="text-primary" />
                    Consultar Documentos por Rango de Fechas
                  </CardTitle>
                  <CardDescription>Busca documentos registrados dentro de un periodo de tiempo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold">Desde</label>
                      <Input type="date" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold">Hasta</label>
                      <Input type="date" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">NIT del Comprador (Opcional)</label>
                    <Input placeholder="NIT del comprador..." value={rangeBuyerNit} onChange={(e) => setRangeBuyerNit(e.target.value)} />
                  </div>
                  <Button onClick={handleQueryDateRange} disabled={rangeLoading} className="w-full">
                    {rangeLoading ? 'Consultando Rango...' : 'Buscar Documentos'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Results Tabs */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="shadow-md border-border/50 h-full flex flex-col">
                <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Resultados del Buscador</CardTitle>
                    <CardDescription>Visualización de logs de red SOAP y XML.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden flex flex-col min-h-[400px]">
                  {/* Select log structure to view depending on which operation was called last */}
                  {guidResult || rangeResult || pdfResult ? (
                    <Tabs defaultValue="parsed" className="w-full h-full flex flex-col">
                      <TabsList className="bg-muted/50 p-1 flex justify-start rounded-none border-b border-border/40">
                        <TabsTrigger value="parsed" className="px-4 py-2 text-xs flex items-center gap-1.5"><BracketsCurly size={14} />JSON Parseado</TabsTrigger>
                        <TabsTrigger value="soap_req" className="px-4 py-2 text-xs flex items-center gap-1.5"><FileText size={14} />SOAP Request</TabsTrigger>
                        <TabsTrigger value="soap_res" className="px-4 py-2 text-xs flex items-center gap-1.5"><FileText size={14} />SOAP Response</TabsTrigger>
                      </TabsList>
                      <TabsContent value="parsed" className="flex-1 p-4 overflow-auto bg-slate-950 font-mono text-xs text-indigo-300">
                        <pre>{formatJson(guidResult || rangeResult || pdfResult)}</pre>
                      </TabsContent>
                      <TabsContent value="soap_req" className="flex-1 p-4 overflow-auto bg-slate-950 font-mono text-xs text-indigo-300">
                        <pre>{formatXml((guidSoapLog.requestRaw || rangeSoapLog.requestRaw || pdfSoapLog.requestRaw) || '')}</pre>
                      </TabsContent>
                      <TabsContent value="soap_res" className="flex-1 p-4 overflow-auto bg-slate-950 font-mono text-xs text-indigo-300">
                        <pre>{formatXml((guidSoapLog.responseRaw || rangeSoapLog.responseRaw || pdfSoapLog.responseRaw) || '')}</pre>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                      <Info size={40} className="mb-2 text-muted-foreground/50" />
                      <p>Use alguno de los buscadores de la izquierda para obtener información del DTE.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ==================== TAB 4: ANULACIONES ==================== */}
        <TabsContent value="anular" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              <Card className="shadow-sm border-border/40">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trash size={20} className="text-destructive" />
                    Anular Documento FEL (VOID_DOCUMENT)
                  </CardTitle>
                  <CardDescription>Genera el DTE de anulación y lo firma electrónicamente.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">GUID/UUID a Anular</label>
                    <Input
                      placeholder="Ingrese el GUID del DTE..."
                      value={voidGuid}
                      onChange={(e) => setVoidGuid(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold">Receptor NIT/CUI</label>
                      <Input
                        placeholder="NIT o CUI del cliente..."
                        value={voidReceptor}
                        onChange={(e) => setVoidReceptor(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold">Fecha de Emisión Original</label>
                      <Input
                        placeholder="Y-m-dTH:i:s..."
                        value={voidEmissionDate}
                        onChange={(e) => setVoidEmissionDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Motivo de la Anulación</label>
                    <Input
                      placeholder="Ej. Anulación de prueba..."
                      value={voidMotivo}
                      onChange={(e) => setVoidMotivo(e.target.value)}
                    />
                  </div>

                  <Button onClick={handleVoidByGuid} disabled={voidLoading} className="w-full flex items-center justify-center gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    <Trash size={16} />
                    {voidLoading ? 'Anulando...' : 'Anular Documento'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Void Results Display */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="shadow-md border-border/50 h-full flex flex-col">
                <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Detalles de Anulación</CardTitle>
                    <CardDescription>Visualización del XML de anulación y respuestas SOAP.</CardDescription>
                  </div>
                  {voidResult && (
                    <Badge variant={voidResult.success ? 'default' : 'destructive'} className="font-semibold">
                      {voidResult.success ? 'Anulado en SAT' : 'Anulación Fallida'}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden flex flex-col min-h-[400px]">
                  {voidResult ? (
                    <Tabs defaultValue="parsed" className="w-full h-full flex flex-col">
                      <TabsList className="bg-muted/50 p-1 flex justify-start rounded-none border-b border-border/40">
                        <TabsTrigger value="parsed" className="px-4 py-2 text-xs flex items-center gap-1.5"><BracketsCurly size={14} />JSON Parseado</TabsTrigger>
                        {voidResult.void_xml && (
                          <TabsTrigger value="xml_void" className="px-4 py-2 text-xs flex items-center gap-1.5"><FileText size={14} />XML Anulación</TabsTrigger>
                        )}
                        <TabsTrigger value="soap_req" className="px-4 py-2 text-xs flex items-center gap-1.5"><FileText size={14} />SOAP Request</TabsTrigger>
                        <TabsTrigger value="soap_res" className="px-4 py-2 text-xs flex items-center gap-1.5"><FileText size={14} />SOAP Response</TabsTrigger>
                      </TabsList>
                      <TabsContent value="parsed" className="flex-1 p-4 overflow-auto bg-slate-950 font-mono text-xs text-indigo-300">
                        <pre>{formatJson(voidResult)}</pre>
                      </TabsContent>
                      <TabsContent value="xml_void" className="flex-1 p-4 overflow-auto bg-slate-950 font-mono text-xs text-indigo-300">
                        <pre>{formatXml(voidResult.void_xml || '')}</pre>
                      </TabsContent>
                      <TabsContent value="soap_req" className="flex-1 p-4 overflow-auto bg-slate-950 font-mono text-xs text-indigo-300">
                        <pre>{formatXml(voidSoapLog.requestRaw || '')}</pre>
                      </TabsContent>
                      <TabsContent value="soap_res" className="flex-1 p-4 overflow-auto bg-slate-950 font-mono text-xs text-indigo-300">
                        <pre>{formatXml(voidSoapLog.responseRaw || '')}</pre>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                      <Info size={40} className="mb-2 text-muted-foreground/50" />
                      <p>Ingrese los datos a la izquierda y presione "Anular Documento" para iniciar el proceso.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default FelPlayground;
