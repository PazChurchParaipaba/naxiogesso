/**
 * NAXIO GESSO - Módulo Especialista em Gesso, Drywall e Montagem
 * Fortaleza / Brasil
 * Focado em: Molduras, Drywall, Placas 3D, Acartonado, Perfis/Ferragens, Fixação e Iluminação
 */

window.NaxioGesso = {
    // Materiais padrão e catálogo rápido para Gesso e Drywall (Fortaleza)
    catalogDefaults: [
        { nome: 'Molduras de Gesso (Metro Linear)', categoria: 'Molduras', subcategoria: 'Molduras Tradicionais', preco: 12.00, preco_custo: 5.00, unidade: 'M', cod: 'MOLD-001' },
        { nome: 'Molduras Decorativas Trabalhadas', categoria: 'Molduras', subcategoria: 'Molduras Decorativas', preco: 18.50, preco_custo: 7.50, unidade: 'M', cod: 'MOLD-002' },
        { nome: 'Pranchas para Guarda Roupa (Gesso Reforçado)', categoria: 'Pranchas para Guarda-Roupa', subcategoria: 'Pranchas para Guarda Roupa', preco: 45.00, preco_custo: 22.00, unidade: 'UN', cod: 'PRAN-001' },
        { nome: 'Placas 3D Gesso Decorativas (Modelo Dunas/Pétalas)', categoria: 'Placas 3D', subcategoria: 'Placas 3D Gesso', preco: 8.50, preco_custo: 3.20, unidade: 'UN', cod: 'P3D-001' },
        { nome: 'Placa Acartonado 2,00 x 0,60m (Forro Estruturado)', categoria: 'Placas de Drywall & Acartonado', subcategoria: 'Placa 2x0,60 Acartonado', preco: 28.90, preco_custo: 17.50, unidade: 'CHAPA', cod: 'PLA-2X060' },
        { nome: 'Placa Drywall ST 1,20 x 1,80m (Standard)', categoria: 'Placas de Drywall & Acartonado', subcategoria: 'Placa 1,20x1,80 Drywall', preco: 42.00, preco_custo: 26.00, unidade: 'CHAPA', cod: 'DRY-120X180' },
        { nome: 'Arame Galvanizado para Forro (Rolo / Kg)', categoria: 'Arames & Agazin', subcategoria: 'Arame para Forro', preco: 24.00, preco_custo: 14.00, unidade: 'KG', cod: 'ARA-FORRO' },
        { nome: 'Agazin para Fixação / Forro', categoria: 'Arames & Agazin', subcategoria: 'Agazin', preco: 35.00, preco_custo: 19.00, unidade: 'PCT', cod: 'AGAZIN-01' },
        { nome: 'Espátula de Aço Inox para Gesseiro 10cm', categoria: 'Ferramentas & Espátulas', subcategoria: 'Espátulas & Desempenadeiras', preco: 22.50, preco_custo: 11.00, unidade: 'UN', cod: 'FERR-ESP10' },
        { nome: 'Espátula de Aço Inox para Gesseiro 15cm', categoria: 'Ferramentas & Espátulas', subcategoria: 'Espátulas & Desempenadeiras', preco: 27.00, preco_custo: 13.50, unidade: 'UN', cod: 'FERR-ESP15' },
        { nome: 'Pregos de Aço para Gesso (Pacote 100un)', categoria: 'Fixação, Pitões & Buchas', subcategoria: 'Pregos de Aço', preco: 15.00, preco_custo: 7.00, unidade: 'PCT', cod: 'PREG-ACO' },
        { nome: 'Pitão N° 6 com Bucha N° 6 (Pacote)', categoria: 'Fixação, Pitões & Buchas', subcategoria: 'Pitão N°6 & Bucha N°6', preco: 18.00, preco_custo: 8.50, unidade: 'PCT', cod: 'PIT-06' },
        { nome: 'Pitão N° 8 com Bucha N° 8 (Pacote)', categoria: 'Fixação, Pitões & Buchas', subcategoria: 'Pitão N°8 & Bucha N°8', preco: 22.00, preco_custo: 10.50, unidade: 'PCT', cod: 'PIT-08' },
        { nome: 'Parafuso Drywall Ponta Agulha GN 25 (Caixa 1000un)', categoria: 'Parafusos para Drywall', subcategoria: 'Parafusos Ponta Agulha / Broca', preco: 38.00, preco_custo: 20.00, unidade: 'CX', cod: 'PAR-GN25' },
        { nome: 'Parafuso Drywall Ponta Broca (Caixa 1000un)', categoria: 'Parafusos para Drywall', subcategoria: 'Parafusos Ponta Agulha / Broca', preco: 44.00, preco_custo: 23.50, unidade: 'CX', cod: 'PAR-BROCA' },
        { nome: 'Perfil Montante 48mm Drywall (Barra 3m)', categoria: 'Ferragens & Perfis', subcategoria: 'Ferragens: Montante', preco: 26.50, preco_custo: 15.80, unidade: 'BARRA', cod: 'FERR-MONT48' },
        { nome: 'Perfil Montante 70mm Drywall (Barra 3m)', categoria: 'Ferragens & Perfis', subcategoria: 'Ferragens: Montante', preco: 32.00, preco_custo: 19.50, unidade: 'BARRA', cod: 'FERR-MONT70' },
        { nome: 'Perfil Guia 48mm Drywall (Barra 3m)', categoria: 'Ferragens & Perfis', subcategoria: 'Ferragens: Guia', preco: 23.50, preco_custo: 14.00, unidade: 'BARRA', cod: 'FERR-GUIA48' },
        { nome: 'Cantoneira Perfurada / Reforço Drywall (Barra 3m)', categoria: 'Ferragens & Perfis', subcategoria: 'Ferragens: Cantoneiras', preco: 16.50, preco_custo: 9.20, unidade: 'BARRA', cod: 'FERR-CANT' },
        { nome: 'Fita Telada Autoadesiva Drywall 45m', categoria: 'Fitas Teladas & Tratamento', subcategoria: 'Fita Telada para Drywall', preco: 19.90, preco_custo: 10.50, unidade: 'ROLO', cod: 'FITA-TEL45' },
        { nome: 'Fita de LED COB 240 Leds Branco Quente / Frio (Rolo 5m)', categoria: 'Iluminação & Fitas de LED', subcategoria: 'Fitas de LED', preco: 49.90, preco_custo: 24.00, unidade: 'ROLO', cod: 'LED-FITA5M' },
        { nome: 'Painel Plafon LED Embutir 18W Quadrado Slim', categoria: 'Iluminação & Fitas de LED', subcategoria: 'Painéis de LED', preco: 29.90, preco_custo: 14.50, unidade: 'UN', cod: 'LED-PAINEL18W' },
        { nome: 'Painel Plafon LED Embutir 24W Quadrado Slim', categoria: 'Iluminação & Fitas de LED', subcategoria: 'Painéis de LED', preco: 38.00, preco_custo: 19.00, unidade: 'UN', cod: 'LED-PAINEL24W' },
        { nome: 'Spot Croic Direcionável Embutir Redondo/Quadrado 5W', categoria: 'Spots & Croics', subcategoria: 'Croics & Spots', preco: 15.90, preco_custo: 7.20, unidade: 'UN', cod: 'CROIC-5W' },
        { nome: 'Spot Croic Direcionável Embutir 7W Branco Quente', categoria: 'Spots & Croics', subcategoria: 'Croics & Spots', preco: 19.90, preco_custo: 9.00, unidade: 'UN', cod: 'CROIC-7W' },
        { nome: 'Gesso Rápido em Pó (Saco 40kg)', categoria: 'Gesso em Pó & Massas', subcategoria: 'Gesso Rápido / Cola', preco: 22.00, preco_custo: 12.00, unidade: 'SC', cod: 'GESSO-RAP40' },
        { nome: 'Gesso Cola Especial para Molduras (Saco 5kg)', categoria: 'Gesso em Pó & Massas', subcategoria: 'Gesso Rápido / Cola', preco: 16.00, preco_custo: 8.50, unidade: 'SC', cod: 'GESSO-COLA5' }
    ],

    init: () => {
        console.log("🏛️ NAXIO GESSO: Inicializando ecossistema de Gesso & Drywall...");
        NaxioGesso.injectPainelButtons();
        NaxioGesso.enhanceProductForm();
    },

    injectPainelButtons: () => {
        const panel = document.querySelector('.painel-actions-grid');
        if (!panel) return;

        // 1. Botão Orçamentos e O.S. de Gesso / Montagem
        if (!document.getElementById('btn-gesso-orcamento')) {
            const btn = document.createElement('button');
            btn.id = 'btn-gesso-orcamento';
            btn.className = 'btn action-btn';
            btn.style.background = 'linear-gradient(135deg, #0284c7, #0369a1)';
            btn.style.color = '#fff';
            btn.style.border = 'none';
            btn.innerHTML = '<i class="ri-hammer-line"></i> Orçamento & Obra';
            btn.onclick = NaxioGesso.openOrcamentoModal;
            panel.insertBefore(btn, panel.children[2] || null);
        }

        // 2. Botão Frete & Carga Pesada (Peso, Veículo e Canhoto)
        if (!document.getElementById('btn-gesso-frete')) {
            const btnFrete = document.createElement('button');
            btnFrete.id = 'btn-gesso-frete';
            btnFrete.className = 'btn action-btn';
            btnFrete.style.background = 'linear-gradient(135deg, #0284c7, #0891b2)';
            btnFrete.style.color = '#fff';
            btnFrete.style.border = 'none';
            btnFrete.innerHTML = '<i class="ri-truck-line"></i> Frete & Carga';
            btnFrete.title = 'Calcular peso da carga, capacidade do veículo e canhoto de entrega';
            btnFrete.onclick = NaxioGesso.openFreteModal;
            panel.insertBefore(btnFrete, panel.children[3] || null);
        }

        // 3. Botão Alerta de Estoque Mínimo & Reposição de Fábrica
        if (!document.getElementById('btn-gesso-estoque-min')) {
            const btnEstoque = document.createElement('button');
            btnEstoque.id = 'btn-gesso-estoque-min';
            btnEstoque.className = 'btn action-btn';
            btnEstoque.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
            btnEstoque.style.color = '#fff';
            btnEstoque.style.border = 'none';
            btnEstoque.innerHTML = '<i class="ri-alarm-warning-line"></i> Reposição Fábrica';
            btnEstoque.title = 'Alerta de estoque baixo e sugestão de pedido para fornecedor';
            btnEstoque.onclick = NaxioGesso.openEstoqueMinimoModal;
            panel.insertBefore(btnEstoque, panel.children[4] || null);
        }

        // 4. Botão Calculadora de Forro & Drywall (M2)
        if (!document.getElementById('btn-gesso-calc')) {
            const btnCalc = document.createElement('button');
            btnCalc.id = 'btn-gesso-calc';
            btnCalc.className = 'btn action-btn';
            btnCalc.style.background = 'linear-gradient(135deg, #475569, #334155)';
            btnCalc.style.color = '#fff';
            btnCalc.style.border = '1px solid #64748b';
            btnCalc.innerHTML = '<i class="ri-calculator-line"></i> Calculadora m²';
            btnCalc.onclick = NaxioGesso.openCalculatorModal;
            panel.appendChild(btnCalc);
        }

        // 5. Botão Carga Rápida do Catálogo de Gesso Fortaleza
        if (!document.getElementById('btn-gesso-carga-catalogo')) {
            const btnCat = document.createElement('button');
            btnCat.id = 'btn-gesso-carga-catalogo';
            btnCat.className = 'btn action-btn';
            btnCat.style.background = 'linear-gradient(135deg, #059669, #047857)';
            btnCat.style.color = '#fff';
            btnCat.style.border = 'none';
            btnCat.innerHTML = '<i class="ri-download-cloud-line"></i> Carga Gesso';
            btnCat.title = 'Carregar materiais de gesso, drywall e iluminação na loja';
            btnCat.onclick = NaxioGesso.popularCatalogoGesso;
            panel.appendChild(btnCat);
        }
    },

    enhanceProductForm: () => {
        // Popula automaticamente o select de categorias de gesso caso esteja vazio ou precise de gesso
        const catSelect = document.getElementById('new-prod-cat');
        if (catSelect) {
            const gessoCategories = CONFIG.categoriesByStoreType['Gesso'] || [];
            gessoCategories.forEach(cat => {
                if (!Array.from(catSelect.options).some(o => o.value === cat)) {
                    catSelect.add(new Option(cat, cat));
                }
            });
        }
    },

    // Modal de Calculadora de Materiais por m²
    openCalculatorModal: () => {
        const modalHtml = `
            <div id="gesso-calc-modal" class="modal-overlay" style="display:flex; z-index:10010;">
                <div class="modal-content" style="max-width: 600px; width: 95%;">
                    <div class="modal-header">
                        <h3><i class="ri-calculator-line"></i> Calculadora de Materiais (m² de Forro / Drywall)</h3>
                        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('gesso-calc-modal').remove()">Fechar</button>
                    </div>
                    <div class="modal-body">
                        <p class="text-xs" style="color:var(--text-muted); margin-bottom:15px;">
                            Calcule a estimativa aproximada de placas, perfis, parafusos e arame para a sua metragem quadrada em Fortaleza.
                        </p>
                        
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                            <div class="input-wrapper">
                                <label>Tipo de Serviço</label>
                                <select id="calc-tipo-servico" class="input-field" onchange="NaxioGesso.calcularMateriais()">
                                    <option value="forro_drywall">Forro Drywall FCK (Placa 1,80x1,20)</option>
                                    <option value="forro_acartonado">Forro Acartonado (Placa 2,00x0,60)</option>
                                    <option value="parede_drywall">Parede Drywall (Divisória 2 Faces)</option>
                                </select>
                            </div>
                            <div class="input-wrapper">
                                <label>Área Total (m²)</label>
                                <input type="number" id="calc-area-m2" class="input-field" placeholder="Ex: 50" value="50" oninput="NaxioGesso.calcularMateriais()">
                            </div>
                        </div>

                        <div id="calc-resultado" style="margin-top:15px; background: rgba(15,23,42,0.8); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 15px;">
                            <!-- Calculado via JS -->
                        </div>
                    </div>
                    <div class="modal-footer" style="display:flex; gap:10px;">
                        <button class="btn btn-secondary" onclick="document.getElementById('gesso-calc-modal').remove()">Fechar</button>
                        <button class="btn btn-primary" onclick="NaxioGesso.adicionarAoOrcamentoCalculo()">
                            <i class="ri-file-add-line"></i> Copiar Estimativa
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        NaxioGesso.calcularMateriais();
    },

    calcularMateriais: () => {
        const area = parseFloat(document.getElementById('calc-area-m2')?.value || 0);
        const tipo = document.getElementById('calc-tipo-servico')?.value || 'forro_drywall';
        const resDiv = document.getElementById('calc-resultado');
        if (!resDiv) return;

        if (area <= 0) {
            resDiv.innerHTML = '<p class="text-muted text-center">Informe a metragem para calcular.</p>';
            return;
        }

        let placas = 0, perfis = 0, arameKg = 0, parafusos = 0, fitaM = 0;

        if (tipo === 'forro_drywall') {
            // Placa 1.20 x 1.80 = 2.16 m² por placa
            placas = Math.ceil((area / 2.16) * 1.05); // 5% quebra
            perfis = Math.ceil(area * 1.8 / 3); // barras canaleta F530 ou perfil
            arameKg = (area * 0.12).toFixed(1);
            parafusos = Math.ceil(area * 16);
            fitaM = Math.ceil(area * 1.4);
        } else if (tipo === 'forro_acartonado') {
            // Placa 2.00 x 0.60 = 1.20 m² por placa
            placas = Math.ceil((area / 1.20) * 1.05);
            perfis = Math.ceil(area * 2.0 / 3);
            arameKg = (area * 0.15).toFixed(1);
            parafusos = Math.ceil(area * 18);
            fitaM = Math.ceil(area * 1.8);
        } else {
            // Parede Divisória (placa dos 2 lados = dobro de área de placa)
            placas = Math.ceil((area * 2 / 2.16) * 1.05);
            perfis = Math.ceil((area * 1.2 / 3) + (area * 0.8 / 3)); // montantes + guias
            arameKg = 0;
            parafusos = Math.ceil(area * 28);
            fitaM = Math.ceil(area * 2.5);
        }

        resDiv.innerHTML = `
            <div style="font-weight: 800; color: #38bdf8; margin-bottom: 10px; font-size: 0.95rem;">
                <i class="ri-check-double-line"></i> Estimativa de Materiais para ${area} m²:
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size: 0.85rem;">
                <div>📦 <strong>Placas Necessárias:</strong> ${placas} un</div>
                <div>📏 <strong>Perfis/Ferragens (Barras 3m):</strong> ~${perfis} barras</div>
                <div>🔩 <strong>Parafusos Drywall:</strong> ~${parafusos} un</div>
                <div>🧵 <strong>Fita Telada:</strong> ~${fitaM} metros</div>
                ${arameKg > 0 ? `<div>⛓️ <strong>Arame para Forro:</strong> ~${arameKg} kg</div>` : ''}
                <div>📍 <strong>Pitões & Buchas N°6/8:</strong> ~${Math.ceil(area * 1.5)} conjuntos</div>
            </div>
        `;
    },

    adicionarAoOrcamentoCalculo: () => {
        const area = document.getElementById('calc-area-m2')?.value;
        const resText = document.getElementById('calc-resultado')?.innerText;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(`Orçamento Naxio Gesso (${area} m²):\n` + resText);
            App.utils?.toast("Estimativa copiada para a área de transferência!", "success");
        } else {
            App.utils?.toast("Estimativa calculada!", "success");
        }
    },

    // Modal de Ordem de Serviço & Orçamento de Gesso/Obra
    openOrcamentoModal: async () => {
        const modalHtml = `
            <div id="gesso-os-modal" class="modal-overlay" style="display:flex; z-index:10005;">
                <div class="modal-content modal-full" style="max-width: 900px; width: 95%;">
                    <div class="modal-header">
                        <h3><i class="ri-hammer-line"></i> NAXIO GESSO - Orçamentos & Ordens de Montagem</h3>
                        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('gesso-os-modal').remove()">Fechar</button>
                    </div>
                    <div class="modal-body">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                            <div style="font-size:0.9rem; color:var(--text-muted);">Gerencie serviços de instalação, forro, placas 3D e drywall.</div>
                            <button class="btn btn-primary btn-sm" onclick="NaxioGesso.newOrcamento()">+ Novo Orçamento / Obra</button>
                        </div>

                        <div id="gesso-os-list" style="max-height: 450px; overflow-y: auto;">
                            <p class="text-center text-muted" style="padding:20px;">Carregando ordens de gesso...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        NaxioGesso.loadOrcamentosList();
    },

    loadOrcamentosList: async () => {
        const listDiv = document.getElementById('gesso-os-list');
        if (!listDiv) return;

        try {
            let combined = [];

            // 1. Tenta carregar de orders (status orcamento)
            try {
                const { data: ords } = await _sb.from('orders')
                    .select('*')
                    .eq('store_id', App.state.storeId)
                    .eq('status', 'orcamento')
                    .order('created_at', { ascending: false });

                if (ords) {
                    ords.forEach(o => {
                        let parsed = {};
                        try { parsed = JSON.parse(o.observacao || '{}'); } catch(e){}
                        combined.push({
                            id: o.id,
                            cliente_nome: parsed.cliente_nome || 'Cliente Balcão',
                            cliente_contato: parsed.cliente_contato || '',
                            veiculo_modelo: parsed.local_obra || 'Obra Gesso',
                            descricao_problema: parsed.descricao || '',
                            valor_total: o.total_pago || 0,
                            status: 'orçamento',
                            created_at: o.created_at
                        });
                    });
                }
            } catch(e) {}

            // 2. Tenta carregar de service_orders
            try {
                const { data: sOrders } = await _sb.from('service_orders')
                    .select('*')
                    .eq('store_id', App.state.storeId)
                    .order('created_at', { ascending: false });
                if (sOrders) {
                    sOrders.forEach(so => {
                        if (!combined.some(c => c.id === so.id)) combined.push(so);
                    });
                }
            } catch(e) {}

            // 3. Mescla com local storage para orçamentos offline (sem duplicar)
            const localOrcamentos = JSON.parse(localStorage.getItem('naxio_gesso_orcamentos') || '[]');
            localOrcamentos.forEach(lo => {
                if (!combined.some(c => c.id === lo.id)) combined.push(lo);
            });

            // Remove duplicatas exatas criadas em cascata (mesmo cliente, mesmo valor e mesma descrição)
            const seen = new Set();
            combined = combined.filter(item => {
                const key = `${(item.cliente_nome||'').toLowerCase()}|${parseFloat(item.valor_total||0).toFixed(2)}|${(item.descricao_problema||'').toLowerCase()}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            if (combined.length === 0) {
                listDiv.innerHTML = `
                    <div style="text-align:center; padding:30px; background:rgba(255,255,255,0.02); border-radius:12px; border:1px dashed rgba(255,255,255,0.1);">
                        <i class="ri-file-list-3-line" style="font-size:2.5rem; color:var(--primary); opacity:0.8;"></i>
                        <p style="margin:10px 0; font-weight:600;">Nenhum orçamento ou obra aberta no momento.</p>
                        <button class="btn btn-primary btn-sm" onclick="NaxioGesso.newOrcamento()">Criar Primeiro Orçamento</button>
                    </div>
                `;
                return;
            }

            const orders = combined;

            listDiv.innerHTML = orders.map(o => `
                <div style="background:#1e293b; border:1px solid #334155; border-radius:10px; padding:12px 16px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-weight:800; color:#fff; font-size:1rem;">#${(o.id || '').slice(0,6)} - ${o.cliente_nome || 'Cliente'}</span>
                            <span style="font-size:0.75rem; padding:2px 8px; border-radius:6px; background:#0284c7; color:#fff; font-weight:700;">${(o.status || 'aberta').toUpperCase()}</span>
                        </div>
                        <div style="font-size:0.85rem; color:#94a3b8; margin-top:4px;">
                            <span>📍 <strong>Local/Obra:</strong> ${o.veiculo_modelo || 'Obra / Reforma'}</span> | 
                            <span>📞 ${o.cliente_contato || 'Sem contato'}</span>
                        </div>
                        <div style="font-size:0.8rem; color:#cbd5e1; margin-top:2px;">
                            ${o.descricao_problema || 'Serviço de Gesso e Drywall'}
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:1.1rem; font-weight:800; color:#4ade80;">R$ ${(o.valor_total || 0).toFixed(2)}</div>
                        <div style="margin-top:6px; display:flex; gap:6px;">
                            <button class="btn btn-sm btn-secondary" onclick="NaxioGesso.openDetalhesOrcamento('${o.id}')">
                                Ver Detalhes
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');

        } catch (err) {
            console.error("Erro ao listar obras de gesso:", err);
            listDiv.innerHTML = `<p class="text-danger text-center">Erro ao carregar dados: ${err.message}</p>`;
        }
    },

    newOrcamento: async () => {
        const modalHtml = `
            <div id="new-gesso-os-modal" class="modal-overlay" style="display:flex; z-index:10015;">
                <div class="modal-content" style="max-width: 550px; width: 95%;">
                    <div class="modal-header">
                        <h3><i class="ri-file-add-line"></i> Novo Orçamento / Obra de Gesso</h3>
                        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('new-gesso-os-modal').remove()">Cancelar</button>
                    </div>
                    <div class="modal-body">
                        <div class="input-wrapper">
                            <label>Nome do Cliente / Construtora</label>
                            <input id="gesso-cli-nome" class="input-field" placeholder="Ex: Roberto Silva">
                        </div>
                        <div class="input-wrapper">
                            <label>Contato / WhatsApp</label>
                            <input id="gesso-cli-contato" class="input-field" placeholder="(85) 90000-0000">
                        </div>
                        <div class="input-wrapper">
                            <label>Endereço da Obra / Bairro (Fortaleza)</label>
                            <input id="gesso-cli-local" class="input-field" placeholder="Ex: Aldeota - Rua Silva Jatahy, 120">
                        </div>
                        <div class="input-wrapper">
                            <label>Descrição dos Serviços & Materiais</label>
                            <textarea id="gesso-cli-desc" class="input-field" rows="3" placeholder="Ex: Forro de gesso acartonado 40m², cortineiro iluminado com fita de LED e sanca com molduras..."></textarea>
                        </div>
                        <div class="input-wrapper">
                            <label>Valor Estimado (R$)</label>
                            <input type="number" id="gesso-cli-valor" class="input-field" placeholder="0.00" value="0.00">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary btn-full" onclick="NaxioGesso.saveOrcamento()">Salvar Orçamento</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    // Exibir detalhes completos do orçamento de gesso
    openDetalhesOrcamento: async (orcId) => {
        let orc = null;

        // Procura primeiro no cache local
        const localList = JSON.parse(localStorage.getItem('naxio_gesso_orcamentos') || '[]');
        orc = localList.find(x => x.id === orcId);

        // Se não achou, busca no banco orders
        if (!orc && typeof _sb !== 'undefined') {
            try {
                const { data: o } = await _sb.from('orders').select('*').eq('id', orcId).single();
                if (o) {
                    let parsed = {};
                    try { parsed = JSON.parse(o.observacao || '{}'); } catch(e){}
                    orc = {
                        id: o.id,
                        cliente_nome: parsed.cliente_nome || 'Cliente Balcão',
                        cliente_contato: parsed.cliente_contato || 'Sem contato',
                        veiculo_modelo: parsed.local_obra || 'Obra Gesso',
                        descricao_problema: parsed.descricao || 'Serviço de Gesso e Drywall',
                        valor_total: o.total_pago || 0,
                        status: o.status || 'orçamento',
                        created_at: o.created_at
                    };
                }
            } catch(e) {}
        }

        // Se ainda não achou, busca em service_orders
        if (!orc && typeof _sb !== 'undefined') {
            try {
                const { data: so } = await _sb.from('service_orders').select('*').eq('id', orcId).single();
                if (so) orc = so;
            } catch(e) {}
        }

        if (!orc) {
            return alert("Orçamento não localizado.");
        }

        NaxioGesso.activeOrcamento = orc;

        const modalHtml = `
            <div id="gesso-detalhes-modal" class="modal-overlay" style="display:flex; z-index:10020;">
                <div class="modal-content" style="max-width: 600px; width: 95%; background:#ffffff; color:#0f172a; border-radius:18px; box-shadow:0 20px 40px rgba(0,0,0,0.2);">
                    <div class="modal-header" style="border-bottom:1px solid #e2e8f0; padding:16px 20px; display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0; font-family:'Outfit'; font-weight:800; color:#0f172a; display:flex; align-items:center; gap:8px;">
                            <i class="ri-file-text-line" style="color:#0284c7;"></i> Detalhes do Orçamento #${String(orc.id || '').slice(0,8)}
                        </h3>
                        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('gesso-detalhes-modal').remove()">Fechar</button>
                    </div>
                    <div class="modal-body" style="padding:20px; display:flex; flex-direction:column; gap:16px;">
                        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                <strong style="font-size:1.15rem; color:#0f172a;">${orc.cliente_nome || 'Cliente'}</strong>
                                <span style="background:#0284c7; color:#fff; font-size:0.75rem; font-weight:800; padding:3px 10px; border-radius:8px; text-transform:uppercase;">${orc.status || 'ORÇAMENTO'}</span>
                            </div>
                            <div style="font-size:0.9rem; color:#475569; display:flex; flex-direction:column; gap:6px;">
                                <div>📞 <strong>Contato / WhatsApp:</strong> ${orc.cliente_contato || 'Não informado'}</div>
                                <div>📍 <strong>Local da Obra:</strong> ${orc.veiculo_modelo || 'Obra Gesso Fortaleza'}</div>
                                <div>📅 <strong>Data:</strong> ${new Date(orc.created_at || Date.now()).toLocaleString()}</div>
                            </div>
                        </div>

                        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px;">
                            <label style="font-size:0.75rem; font-weight:800; text-transform:uppercase; color:#64748b; letter-spacing:0.5px; margin-bottom:6px; display:block;">Descrição do Serviço & Especificações:</label>
                            <div style="font-size:0.95rem; color:#0f172a; white-space:pre-wrap; line-height:1.5;">${orc.descricao_problema || 'Nenhuma observação informada.'}</div>
                        </div>

                        <div style="background:#f0fdf4; border:1.5px solid #86efac; border-radius:12px; padding:16px; display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-weight:800; color:#166534; font-size:1rem; text-transform:uppercase;">Valor Total Estimado:</span>
                            <span style="font-size:1.8rem; font-weight:900; color:#15803d; font-family:'Outfit';">R$ ${parseFloat(orc.valor_total || 0).toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="modal-footer" style="border-top:1px solid #e2e8f0; padding:16px 20px; display:flex; gap:10px; justify-content:space-between; align-items:center;">
                        <button class="btn btn-danger btn-sm" onclick="NaxioGesso.excluirOrcamento('${orc.id}')" style="background:#ef4444; color:#fff; border:none; padding:8px 14px; border-radius:8px;">
                            <i class="ri-delete-bin-line"></i> Excluir
                        </button>
                        <div style="display:flex; gap:10px;">
                            <button class="btn btn-outline btn-sm" onclick="NaxioGesso.imprimirOrcamento()" style="border:1px solid #cbd5e1;">
                                <i class="ri-printer-line"></i> Imprimir / PDF
                            </button>
                            <button class="btn btn-primary btn-sm" onclick="NaxioGesso.enviarOrcamentoWhatsApp()" style="background:#25d366; border:none; color:#fff;">
                                <i class="ri-whatsapp-line"></i> Enviar no WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    activeOrcamento: null,

    imprimirOrcamento: (orcParam) => {
        const orc = orcParam || NaxioGesso.activeOrcamento || {};

        const dataFormatada = new Date(orc.created_at || Date.now()).toLocaleDateString('pt-BR');
        const horaFormatada = new Date(orc.created_at || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const printWindow = window.open('', '_blank', 'width=800,height=750');
        if (!printWindow) {
            return alert("Por favor, permita pop-ups no navegador para emitir a impressão.");
        }

        printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Orçamento Naxio Gesso #${String(orc.id || '').slice(0, 8)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, Helvetica, sans-serif;
            padding: 30px;
            color: #1e293b;
            background: #ffffff;
            font-size: 13px;
            line-height: 1.5;
        }
        .container {
            max-width: 680px;
            margin: 0 auto;
            border: 1px solid #cbd5e1;
            padding: 24px;
            border-radius: 8px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 14px;
            margin-bottom: 16px;
        }
        .header h1 {
            font-size: 22px;
            color: #0284c7;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 4px;
        }
        .header p {
            font-size: 11px;
            color: #64748b;
        }
        .doc-badge {
            display: inline-block;
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            color: #0369a1;
            padding: 6px 14px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 13px;
            margin-top: 10px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 16px;
        }
        .info-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 10px 12px;
            border-radius: 6px;
        }
        .info-box label {
            display: block;
            font-size: 10px;
            text-transform: uppercase;
            font-weight: bold;
            color: #64748b;
            margin-bottom: 2px;
        }
        .info-box span {
            font-size: 13px;
            font-weight: 600;
            color: #0f172a;
        }
        .section-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 14px;
            border-radius: 6px;
            margin-bottom: 16px;
        }
        .section-box h3 {
            font-size: 11px;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
        }
        .section-box .desc-content {
            font-size: 13px;
            color: #0f172a;
            white-space: pre-wrap;
        }
        .total-box {
            background: #f0fdf4;
            border: 2px solid #86efac;
            padding: 14px 18px;
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }
        .total-box span {
            font-size: 14px;
            font-weight: bold;
            color: #166534;
            text-transform: uppercase;
        }
        .total-box strong {
            font-size: 24px;
            color: #15803d;
        }
        .terms {
            font-size: 11px;
            color: #64748b;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            text-align: center;
            font-size: 11px;
            color: #475569;
            margin-top: 20px;
        }
        .signature-line {
            border-top: 1px solid #94a3b8;
            padding-top: 6px;
        }
        @media print {
            body { padding: 0; }
            .container { border: none; padding: 0; }
            @page { margin: 15mm; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Naxio Gesso & Drywall</h1>
            <p>Forros • Drywall • Molduras de Gesso • Iluminação e Acabamentos Finos</p>
            <p>Fortaleza - CE | Atendimento Comercial: (85) 90000-0000</p>
            <div class="doc-badge">PROPOSTA DE ORÇAMENTO Nº ${String(orc.id || '').slice(0, 10).toUpperCase()}</div>
        </div>

        <div class="info-grid">
            <div class="info-box">
                <label>Cliente / Solicitante</label>
                <span>${(orc.cliente_nome || 'Consumidor').toUpperCase()}</span>
            </div>
            <div class="info-box">
                <label>Contato / WhatsApp</label>
                <span>${orc.cliente_contato || 'Não informado'}</span>
            </div>
            <div class="info-box">
                <label>Local / Endereço da Obra</label>
                <span>${(orc.veiculo_modelo || 'Fortaleza - CE').toUpperCase()}</span>
            </div>
            <div class="info-box">
                <label>Data & Horário de Emissão</label>
                <span>${dataFormatada} às ${horaFormatada}</span>
            </div>
        </div>

        <div class="section-box">
            <h3>Especificações Técnicas, Serviços e Materiais</h3>
            <div class="desc-content">${orc.descricao_problema || 'Serviços de instalação de forro, gesso acartonado e acabamento de alto padrão.'}</div>
        </div>

        <div class="total-box">
            <span>Investimento Estimado da Proposta:</span>
            <strong>R$ ${parseFloat(orc.valor_total || 0).toFixed(2)}</strong>
        </div>

        <div class="terms">
            <p>• <strong>Validade da Proposta:</strong> 15 (quinze) dias a contar da data de emissão.</p>
            <p>• <strong>Condições de Pagamento:</strong> Conforme alinhamento com a equipe comercial no fechamento.</p>
            <p>• <strong>Garantia de Execução:</strong> Serviços executados em conformidade com as normas ABNT vigentes.</p>
        </div>

        <div class="signatures">
            <div class="signature-line">
                <strong>NAXIO GESSO & DRYWALL</strong><br>
                Responsável Técnico
            </div>
            <div class="signature-line">
                <strong>${(orc.cliente_nome || 'CLIENTE').toUpperCase()}</strong><br>
                Assinatura do Contratante
            </div>
        </div>
    </div>

    <script>
        window.onload = function() {
            setTimeout(function() {
                window.focus();
                window.print();
            }, 300);
        };
    <\/script>
</body>
</html>`);
        printWindow.document.close();
    },

    enviarOrcamentoWhatsApp: (orcParam) => {
        const orc = orcParam || NaxioGesso.activeOrcamento || {};
        const tel = String(orc.cliente_contato || '').replace(/\D/g, '');
        const msg = encodeURIComponent(`Olá ${orc.cliente_nome || ''}! Segue o orçamento da Naxio Gesso para a obra (${orc.veiculo_modelo || 'Obra'}):\n\n*Serviço:* ${orc.descricao_problema || ''}\n*Valor Total:* R$ ${parseFloat(orc.valor_total || 0).toFixed(2)}\n\nFicamos à disposição!`);
        window.open(`https://api.whatsapp.com/send?phone=${tel ? (tel.startsWith('55') ? tel : '55' + tel) : ''}&text=${msg}`, '_blank');
    },

    excluirOrcamento: async (orcIdParam) => {
        const orcId = orcIdParam || NaxioGesso.activeOrcamento?.id;
        if (!orcId) return;
        if (!confirm("Deseja realmente excluir este orçamento?")) return;

        // Remove do LocalStorage
        let localList = JSON.parse(localStorage.getItem('naxio_gesso_orcamentos') || '[]');
        localList = localList.filter(x => x.id !== orcId);
        localStorage.setItem('naxio_gesso_orcamentos', JSON.stringify(localList));

        // Remove do Supabase orders se aplicável
        if (typeof _sb !== 'undefined') {
            try { await _sb.from('orders').delete().eq('id', orcId); } catch(e){}
            try { await _sb.from('service_orders').delete().eq('id', orcId); } catch(e){}
        }

        NaxioGesso.activeOrcamento = null;
        App.utils?.toast("Orçamento excluído com sucesso!", "success");
        document.getElementById('gesso-detalhes-modal')?.remove();
        NaxioGesso.loadOrcamentosList();
    },

    saveOrcamento: async () => {
        const nome = document.getElementById('gesso-cli-nome')?.value?.trim();
        const contato = document.getElementById('gesso-cli-contato')?.value?.trim();
        const local = document.getElementById('gesso-cli-local')?.value?.trim();
        const desc = document.getElementById('gesso-cli-desc')?.value?.trim();
        const valor = parseFloat(document.getElementById('gesso-cli-valor')?.value || 0);

        if (!nome) return App.utils?.toast("Informe o nome do cliente", "error");

        try {
            const obsData = {
                tipo: 'orcamento_gesso',
                cliente_nome: nome,
                cliente_contato: contato || '',
                local_obra: local || 'Obra Gesso Fortaleza',
                descricao: desc || ''
            };

            // Salva na tabela orders (apenas 1 chamada direta)
            const { data: orderData, error: orderErr } = await _sb.from('orders').insert({
                store_id: App.state.storeId,
                total_pago: valor,
                status: 'orcamento',
                origem_venda: 'orcamento_gesso',
                observacao: JSON.stringify(obsData)
            }).select().single();

            if (orderErr) {
                // Se falhou nuvem, guarda apenas local
                const localOrcamentos = JSON.parse(localStorage.getItem('naxio_gesso_orcamentos') || '[]');
                localOrcamentos.unshift({
                    id: 'ORC-' + Date.now().toString(36).toUpperCase(),
                    cliente_nome: nome,
                    cliente_contato: contato || '',
                    veiculo_modelo: local || 'Obra Gesso Fortaleza',
                    descricao_problema: desc || '',
                    valor_total: valor,
                    status: 'orcamento',
                    created_at: new Date().toISOString()
                });
                localStorage.setItem('naxio_gesso_orcamentos', JSON.stringify(localOrcamentos));
            } else {
                // Salvo com sucesso na nuvem! Também salva no cache local para acesso rápido sem duplicar
                const localOrcamentos = JSON.parse(localStorage.getItem('naxio_gesso_orcamentos') || '[]');
                localOrcamentos.unshift({
                    id: orderData.id,
                    cliente_nome: nome,
                    cliente_contato: contato || '',
                    veiculo_modelo: local || 'Obra Gesso Fortaleza',
                    descricao_problema: desc || '',
                    valor_total: valor,
                    status: 'orcamento',
                    created_at: orderData.created_at || new Date().toISOString()
                });
                localStorage.setItem('naxio_gesso_orcamentos', JSON.stringify(localOrcamentos));
            }

            App.utils?.toast("Orçamento de gesso salvo com sucesso!", "success");
            document.getElementById('new-gesso-os-modal')?.remove();
            NaxioGesso.loadOrcamentosList();

        } catch (err) {
            console.warn("Erro ao salvar:", err);
            App.utils?.toast("Erro ao registrar orçamento", "error");
        }
    },

    // Carga rápida do catálogo de gesso para a loja
    popularCatalogoGesso: async () => {
        if (!App.state.storeId) {
            return alert("Faça login com a loja antes de cadastrar produtos.");
        }

        const confirmou = confirm(
            "🏛️ DESEJA IMPORTAR O CATÁLOGO DE GESSO & DRYWALL?\n\n" +
            "Serão adicionados os materiais essenciais de Fortaleza:\n" +
            "• Molduras, Pranchas para Guarda-Roupa e Placas 3D\n" +
            "• Placas Acartonadas (2x0,60) e Drywall (1,20x1,80)\n" +
            "• Perfis (Montante, Cantoneiras, Guias)\n" +
            "• Fitas Teladas, Pregos de Aço, Pitões 6/8 e Buchas\n" +
            "• Arame para Forro, Agazin, Fitas e Painéis de LED, Croics\n" +
            "• Ferramentas & Espátulas\n\n" +
            "Deseja continuar?"
        );

        if (!confirmou) return;

        App.utils?.toast("Inserindo produtos de gesso na sua loja...", "info");

        let sucesso = 0;
        for (const item of NaxioGesso.catalogDefaults) {
            try {
                const { error } = await _sb.from('products').insert({
                    store_id: App.state.storeId,
                    nome: item.nome,
                    preco: item.preco,
                    preco_prazo: +(item.preco * 1.15).toFixed(2),
                    preco_custo: item.preco_custo,
                    categoria: item.categoria,
                    subcategoria: item.subcategoria,
                    codigo_cardapio: item.cod,
                    descricao: `Material para Gesso & Drywall - NAXIO GESSO Fortaleza. Unidade: ${item.unidade}`,
                    estoque: 100,
                    estoque_minimo: 10,
                    allow_negative_stock: true,
                    exibir_online: true
                });

                if (!error) sucesso++;
            } catch (e) {
                console.warn("Item já existente ou erro:", item.nome, e);
            }
        }

        alert(`✅ Concluído! ${sucesso} produtos de Gesso e Drywall foram adicionados ao estoque da sua loja.`);
        if (App.store?.loadMyProducts) App.store.loadMyProducts();
    },

    // =========================================================================
    // 🚛 1. CONTROLE DE FRETE, PESO DE CARGA & CANHOTO DE ENTREGA
    // =========================================================================
    estimarPesoProduto: (nome, qtd = 1) => {
        const n = (nome || '').toLowerCase();
        let pesoUnit = 1; // Padrão 1kg

        if (n.includes('40kg') || (n.includes('gesso') && n.includes('40'))) pesoUnit = 40;
        else if (n.includes('20kg')) pesoUnit = 20;
        else if (n.includes('10kg')) pesoUnit = 10;
        else if (n.includes('5kg') || n.includes('cola')) pesoUnit = 5;
        else if (n.includes('drywall') || n.includes('chapa') || n.includes('placa')) {
            if (n.includes('1,20') || n.includes('120') || n.includes('st')) pesoUnit = 18; // Placa drywall padrão ~18kg
            else if (n.includes('2,00') || n.includes('2x0,60')) pesoUnit = 12; // Acartonado forro ~12kg
            else if (n.includes('3d')) pesoUnit = 2.5; // Placa 3D gesso ~2.5kg
            else pesoUnit = 15;
        } else if (n.includes('perfil') || n.includes('montante') || n.includes('guia') || n.includes('cantoneira')) {
            pesoUnit = 1.8; // Barra de perfil 3m ~1.8kg
        } else if (n.includes('prancha')) {
            pesoUnit = 8;
        } else if (n.includes('arame')) {
            pesoUnit = 5;
        } else if (n.includes('parafuso')) {
            pesoUnit = 1.6; // Caixa 1000un
        }

        return +(pesoUnit * qtd).toFixed(1);
    },

    openFreteModal: () => {
        const cart = (typeof Varejo !== 'undefined' && Varejo.state?.cart) ? Varejo.state.cart : [];
        let pesoTotal = 0;
        let itensCarga = [];

        if (cart.length > 0) {
            cart.forEach(item => {
                const pesoItem = NaxioGesso.estimarPesoProduto(item.nome, item.qtd || 1);
                pesoTotal += pesoItem;
                itensCarga.push({
                    nome: item.nome,
                    qtd: item.qtd || 1,
                    peso: pesoItem
                });
            });
        }

        const modalHtml = `
            <div id="gesso-frete-modal" class="modal-overlay" style="display:flex; z-index:10015;">
                <div class="modal-content" style="max-width: 650px; width: 95%; background:#ffffff; color:#0f172a; border-radius:18px; box-shadow:0 25px 50px rgba(0,0,0,0.2);">
                    <div class="modal-header" style="border-bottom:1px solid #e2e8f0; padding:16px 20px; display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0; font-family:'Outfit'; font-weight:800; color:#0f172a; display:flex; align-items:center; gap:8px;">
                            <i class="ri-truck-line" style="color:#0284c7;"></i> Controle de Frete & Romaneio de Carga
                        </h3>
                        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('gesso-frete-modal').remove()">Fechar</button>
                    </div>
                    <div class="modal-body" style="padding:20px; display:flex; flex-direction:column; gap:16px; max-height:75vh; overflow-y:auto;">
                        
                        <!-- Card de Peso Total da Venda Atual -->
                        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:16px; display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <span style="font-size:0.75rem; font-weight:800; text-transform:uppercase; color:#64748b; letter-spacing:1px;">Peso Total Estimado:</span>
                                <div style="font-size:2rem; font-weight:900; color:#0f172a; font-family:'Outfit';">
                                    ${pesoTotal.toFixed(1)} <span style="font-size:1.1rem; color:#64748b;">kg</span>
                                    <span style="font-size:0.9rem; color:#94a3b8; font-weight:600;">(~${(pesoTotal/1000).toFixed(2)} Toneladas)</span>
                                </div>
                            </div>
                            <div style="text-align:right;">
                                <span style="font-size:0.75rem; font-weight:800; text-transform:uppercase; color:#64748b;">Itens no Balcão:</span>
                                <div style="font-size:1.3rem; font-weight:800; color:#0284c7;">${cart.length} itens</div>
                            </div>
                        </div>

                        <!-- Indicador de Capacidade de Veículo -->
                        <div style="background:#ffffff; border:1.5px solid #cbd5e1; border-radius:14px; padding:16px;">
                            <label style="font-size:0.8rem; font-weight:800; text-transform:uppercase; color:#475569; display:block; margin-bottom:8px;">
                                Capacidade do Veículo de Transporte:
                            </label>
                            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px;">
                                <div style="border:1.5px solid ${pesoTotal <= 650 ? '#10b981' : '#cbd5e1'}; background:${pesoTotal <= 650 ? '#f0fdf4' : '#f8fafc'}; padding:10px; border-radius:10px; text-align:center;">
                                    <strong style="font-size:0.85rem; color:#0f172a; display:block;">Fiorino / Saveiro</strong>
                                    <span style="font-size:0.75rem; color:#64748b;">Até 650 kg</span>
                                    <div style="font-size:0.75rem; font-weight:800; margin-top:4px; color:${pesoTotal <= 650 ? '#16a34a' : '#dc2626'};">
                                        ${pesoTotal <= 650 ? '✅ Suporta Carga' : '⚠️ Excesso de Peso'}
                                    </div>
                                </div>
                                <div style="border:1.5px solid ${pesoTotal <= 1800 ? '#10b981' : '#cbd5e1'}; background:${pesoTotal <= 1800 ? '#f0fdf4' : '#f8fafc'}; padding:10px; border-radius:10px; text-align:center;">
                                    <strong style="font-size:0.85rem; color:#0f172a; display:block;">VUC / Hyundai HR</strong>
                                    <span style="font-size:0.75rem; color:#64748b;">Até 1.800 kg</span>
                                    <div style="font-size:0.75rem; font-weight:800; margin-top:4px; color:${pesoTotal <= 1800 ? '#16a34a' : '#dc2626'};">
                                        ${pesoTotal <= 1800 ? '✅ Suporta Carga' : '⚠️ Excesso de Peso'}
                                    </div>
                                </div>
                                <div style="border:1.5px solid ${pesoTotal <= 5000 ? '#10b981' : '#cbd5e1'}; background:${pesoTotal <= 5000 ? '#f0fdf4' : '#f8fafc'}; padding:10px; border-radius:10px; text-align:center;">
                                    <strong style="font-size:0.85rem; color:#0f172a; display:block;">Caminhão 3/4</strong>
                                    <span style="font-size:0.75rem; color:#64748b;">Até 5.000 kg</span>
                                    <div style="font-size:0.75rem; font-weight:800; margin-top:4px; color:${pesoTotal <= 5000 ? '#16a34a' : '#dc2626'};">
                                        ${pesoTotal <= 5000 ? '✅ Suporta Carga' : '⚠️ Excesso'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Dados do Frete e Destino -->
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                            <div>
                                <label style="font-size:0.75rem; font-weight:800; text-transform:uppercase; color:#64748b;">Motorista / Freteiro</label>
                                <input id="frete-motorista" class="input-field" placeholder="Ex: Roberto Freteiro (85) 98888-0000" style="margin-top:4px;">
                            </div>
                            <div>
                                <label style="font-size:0.75rem; font-weight:800; text-transform:uppercase; color:#64748b;">Valor do Frete (R$)</label>
                                <input type="number" id="frete-valor" class="input-field" placeholder="0.00" value="50.00" style="margin-top:4px;">
                            </div>
                            <div style="grid-column: 1 / -1;">
                                <label style="font-size:0.75rem; font-weight:800; text-transform:uppercase; color:#64748b;">Endereço de Entrega / Obra</label>
                                <input id="frete-endereco" class="input-field" placeholder="Ex: Rua Silva Jatahy, 120 - Aldeota, Fortaleza" style="margin-top:4px;">
                            </div>
                        </div>

                    </div>
                    <div class="modal-footer" style="border-top:1px solid #e2e8f0; padding:16px 20px; display:flex; justify-content:space-between; align-items:center;">
                        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('gesso-frete-modal').remove()">Cancelar</button>
                        <button class="btn btn-primary btn-sm" onclick="NaxioGesso.imprimirCanhotoEntrega(${pesoTotal})" style="background:linear-gradient(135deg, #0284c7, #0369a1); border:none; padding:10px 18px; font-weight:800;">
                            <i class="ri-printer-line"></i> Imprimir Canhoto de Entrega
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    imprimirCanhotoEntrega: (pesoTotal) => {
        const cart = (typeof Varejo !== 'undefined' && Varejo.state?.cart) ? Varejo.state.cart : [];
        const motorista = document.getElementById('frete-motorista')?.value || 'Transporte Próprio / Freteiro';
        const valorFrete = document.getElementById('frete-valor')?.value || '0.00';
        const endereco = document.getElementById('frete-endereco')?.value || 'Balcão / A retirar';
        const cliente = (typeof Varejo !== 'undefined' && Varejo.state?.currentCliente?.nome) ? Varejo.state.currentCliente.nome : 'CLIENTE BALCÃO';

        const printWindow = window.open('', '_blank', 'width=800,height=750');
        if (!printWindow) return alert("Por favor, permita pop-ups.");

        const rowsHtml = cart.map((it, idx) => `
            <tr>
                <td style="padding:6px; border-bottom:1px solid #cbd5e1; text-align:center;">${idx+1}</td>
                <td style="padding:6px; border-bottom:1px solid #cbd5e1; font-weight:bold;">${it.nome.toUpperCase()}</td>
                <td style="padding:6px; border-bottom:1px solid #cbd5e1; text-align:center; font-weight:bold;">${it.qtd}</td>
                <td style="padding:6px; border-bottom:1px solid #cbd5e1; text-align:right;">${NaxioGesso.estimarPesoProduto(it.nome, it.qtd)} kg</td>
                <td style="padding:6px; border-bottom:1px solid #cbd5e1; text-align:center;">[ &nbsp; ]</td>
            </tr>
        `).join('') || '<tr><td colspan="5" style="padding:15px; text-align:center;">Nenhum produto listado</td></tr>';

        printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Canhoto de Entrega - Naxio Gesso</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:Arial, sans-serif; padding:25px; color:#0f172a; font-size:12px; }
        .box { border:2px dashed #0284c7; padding:18px; border-radius:10px; max-width:650px; margin:0 auto; }
        .header { text-align:center; border-bottom:1px solid #cbd5e1; padding-bottom:10px; margin-bottom:12px; }
        table { width:100%; border-collapse:collapse; margin-top:10px; }
        th { background:#f1f5f9; padding:6px; font-size:11px; text-transform:uppercase; border-bottom:1px solid #cbd5e1; }
        .signatures { display:grid; grid-template-columns:1fr 1fr; gap:30px; margin-top:35px; text-align:center; font-size:11px; }
        .line { border-top:1px solid #000; padding-top:4px; }
    </style>
</head>
<body>
    <div class="box">
        <div class="header">
            <h2 style="color:#0284c7; font-size:18px;">NAXIO GESSO & DRYWALL - ROMANEIO DE CARGA & ENTREGA</h2>
            <p>Fortaleza - CE | Expedição e Entrega Segura</p>
            <p style="margin-top:4px; font-weight:bold;">EMISSÃO: ${new Date().toLocaleString()}</p>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; font-size:12px;">
            <div><strong>DESTINATÁRIO:</strong> ${cliente.toUpperCase()}</div>
            <div><strong>MOTORISTA:</strong> ${motorista.toUpperCase()}</div>
            <div style="grid-column:1/-1;"><strong>ENDEREÇO DA OBRA:</strong> ${endereco.toUpperCase()}</div>
            <div><strong>PESO TOTAL DA CARGA:</strong> ${pesoTotal.toFixed(1)} kg</div>
            <div><strong>TAXA DE FRETE:</strong> R$ ${parseFloat(valorFrete).toFixed(2)}</div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width:30px;">Item</th>
                    <th style="text-align:left;">Descrição do Material</th>
                    <th style="width:50px;">Qtd</th>
                    <th style="width:80px; text-align:right;">Peso Est.</th>
                    <th style="width:60px;">Confere</th>
                </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
        </table>

        <div style="margin-top:15px; font-size:10px; color:#64748b; line-height:1.4;">
            * AVISO AO MOTORISTA: Placas e molduras devem ser transportadas na vertical ou apoiadas em estrado liso. Não coloque sacos de gesso sobre placas.
        </div>

        <div class="signatures">
            <div class="line">
                <strong>EXPEDIÇÃO / CARREGAMENTO</strong><br>
                Naxio Gesso
            </div>
            <div class="line">
                <strong>RECEBIDO NA OBRA POR:</strong><br>
                Nome / RG / Assinatura
            </div>
        </div>
    </div>
    <script>
        window.onload = function() {
            setTimeout(function() { window.focus(); window.print(); }, 300);
        };
    <\/script>
</body>
</html>`);
        printWindow.document.close();
    },

    // =========================================================================
    // 🚨 2. ALERTA DE ESTOQUE MÍNIMO & SUGESTÃO DE REPOSIÇÃO DE FÁBRICA
    // =========================================================================
    openEstoqueMinimoModal: async () => {
        let prods = [];
        try {
            const { data } = await _sb.from('products')
                .select('*')
                .eq('store_id', App.state.storeId)
                .order('estoque', { ascending: true });
            if (data) prods = data;
        } catch(e) {}

        // Filtra os itens que estão com estoque abaixo ou igual ao mínimo (ou abaixo de 15 un)
        const emRisco = prods.filter(p => {
            const est = Number(p.estoque || 0);
            const min = Number(p.estoque_minimo || 10);
            return est <= min;
        });

        const rowsHtml = emRisco.map(p => {
            const est = Number(p.estoque || 0);
            const min = Number(p.estoque_minimo || 10);
            const sugerido = Math.max(20, (min * 3) - est);

            return `
                <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:10px 12px; font-weight:800; color:#0f172a;">${p.nome}</td>
                    <td style="padding:10px 12px; color:#64748b; font-size:0.85rem;">${p.categoria || 'Gesso'}</td>
                    <td style="padding:10px 12px; text-align:center;">
                        <span style="background:${est <= 0 ? '#fee2e2' : '#fef3c7'}; color:${est <= 0 ? '#b91c1c' : '#b45309'}; font-weight:900; padding:3px 10px; border-radius:8px; font-size:0.85rem;">
                            ${est} un
                        </span>
                    </td>
                    <td style="padding:10px 12px; text-align:center; color:#64748b; font-weight:700;">${min} un</td>
                    <td style="padding:10px 12px; text-align:center;">
                        <input type="number" id="sug-${p.id}" value="${sugerido}" style="width:70px; text-align:center; padding:5px; border-radius:6px; border:1px solid #cbd5e1; font-weight:800; color:#0f172a;">
                    </td>
                </tr>
            `;
        }).join('');

        const modalHtml = `
            <div id="gesso-estoque-modal" class="modal-overlay" style="display:flex; z-index:10015;">
                <div class="modal-content" style="max-width: 800px; width: 95%; background:#ffffff; color:#0f172a; border-radius:18px; box-shadow:0 25px 50px rgba(0,0,0,0.2);">
                    <div class="modal-header" style="border-bottom:1px solid #e2e8f0; padding:16px 20px; display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0; font-family:'Outfit'; font-weight:800; color:#b91c1c; display:flex; align-items:center; gap:8px;">
                            <i class="ri-alarm-warning-line"></i> Alerta de Estoque Baixo & Reposição de Fábrica
                        </h3>
                        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('gesso-estoque-modal').remove()">Fechar</button>
                    </div>
                    <div class="modal-body" style="padding:20px; max-height:70vh; overflow-y:auto;">
                        <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:12px 16px; margin-bottom:16px; font-size:0.88rem; color:#991b1b; display:flex; align-items:center; gap:10px;">
                            <i class="ri-error-warning-fill" style="font-size:1.3rem;"></i>
                            <span>Foram identificados <strong>${emRisco.length} produtos críticos</strong> com risco de ruptura. Gere o pedido de compra para a fábrica com 1 clique abaixo.</span>
                        </div>

                        <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
                            <thead>
                                <tr style="background:#f8fafc; border-bottom:2px solid #e2e8f0; text-transform:uppercase; font-size:0.75rem; color:#64748b;">
                                    <th style="padding:10px 12px; text-align:left;">Produto</th>
                                    <th style="padding:10px 12px; text-align:left;">Categoria</th>
                                    <th style="padding:10px 12px; text-align:center;">Estoque Atual</th>
                                    <th style="padding:10px 12px; text-align:center;">Est. Mínimo</th>
                                    <th style="padding:10px 12px; text-align:center;">Sugerido Comprar</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rowsHtml || '<tr><td colspan="5" style="padding:30px; text-align:center; color:#10b981; font-weight:bold;">🎉 Todos os produtos de gesso estão com estoque saudável!</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                    <div class="modal-footer" style="border-top:1px solid #e2e8f0; padding:16px 20px; display:flex; justify-content:space-between; align-items:center;">
                        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('gesso-estoque-modal').remove()">Fechar</button>
                        ${emRisco.length > 0 ? `
                        <button class="btn btn-primary btn-sm" onclick="NaxioGesso.enviarPedidoFabricaWhatsApp()" style="background:#25d366; border:none; padding:10px 18px; font-weight:800; color:#fff;">
                            <i class="ri-whatsapp-line"></i> Enviar Pedido para Fornecedor no WhatsApp
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    enviarPedidoFabricaWhatsApp: () => {
        const inputs = document.querySelectorAll('[id^="sug-"]');
        let itens = [];
        inputs.forEach(inp => {
            const id = inp.id.replace('sug-', '');
            const row = inp.closest('tr');
            const nome = row?.querySelector('td')?.innerText || 'Produto';
            const qtd = parseInt(inp.value) || 0;
            if (qtd > 0) {
                itens.push(`• *${nome}:* ${qtd} unidades`);
            }
        });

        if (itens.length === 0) return alert("Nenhum item selecionado para reposição.");

        const msg = encodeURIComponent(`Olá! Gostaria de fazer uma cotação/pedido de reposição para a *Naxio Gesso & Drywall*:\n\n*LISTA DE REPOSIÇÃO:*\n${itens.join('\n')}\n\nFavor nos enviar disponibilidade e previsão de entrega!`);
        window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
    }
};

// Auto-inicialização quando a página estiver carregada
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        NaxioGesso.init();
    }, 2500);
});
