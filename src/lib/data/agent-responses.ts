export const AGENT_RESPONSES: Record<string, Record<string, string>> = {
  riesgos: {
    pedregal: '<strong>Riesgos activos:</strong><br>🔴 Cálculo estructural sin avance (6 días) — bloquea cobro.<br>⚠️ Si no hay confirmación hoy, 2ª exhibición se mueve al 1 de abril.',
    polanco:  '<strong>Polanco:</strong> Sin riesgos activos. Planta N1 vence el 20 mar y está en proceso.',
    coyoacan: '<strong>🔴 Riesgo crítico:</strong> Cobro de $36K vencido 18 días. Bitácora sin firma.',
  },
  cobro: {
    pedregal: '<strong>Para cobrar la 2ª exhibición:</strong><br>1. Memoria estructural (Ext. Estructural)<br>2. Confirmación ampliación cocina (Jorge)<br>3. Aprobación del cliente<br>Cuello de botella: el externo estructural.',
    polanco:  '<strong>1ª exhibición:</strong> Solo falta la planta N1. Al entregarla se libera el cobro de $28K.',
    coyoacan: '<strong>Para cobrar en Coyoacán:</strong> Firma del cliente en bitácora. Con eso se libera el acta y el cobro de $36K.',
  },
  tiempo: {
    pedregal: '<strong>¿Llegas al 30 de abril?</strong> Sí, con margen ajustado. Riesgo: memoria estructural. <span class="warn">Agenda llamada con el externo hoy.</span>',
    polanco:  '<strong>¿Llegas al 30 de abril?</strong> <span class="ok">Sí, con margen</span>. El ritmo de entregas es consistente.',
    coyoacan: '<strong>Coyoacán:</strong> Deberías haber entregado. El bloqueo es solo administrativo — firma.',
  },
}
