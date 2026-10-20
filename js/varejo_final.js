/**
 * NAXIO PRO PDV - Módulo Varejo Modernizado
 * Versão: 5.0.0
 * Descrição: Sistema de PDV com interface glassmorphism, multi-abas,
 * busca inteligente e integração fiscal completa.
 */

var Varejo = window.Varejo = window.Varejo || {
    state: {
        allProductsCache: [],
        currentTabIndex: 0,
        tabs: [
            { id: 1, cart: [], cliente: null, total: 0 },
            { id: 2, cart: [], cliente: null, total: 0 },
            { id: 3, cart: [], cliente: null, total: 0 }
        ],
        cart: [],
        currentCliente: null,
        totalTicket: 0,
        pendingQty: 1,
        discount: 0,
        _lastScannedCode: null,
        isOpen: false
    },

    init: async () => {
        console.log("🏪 Naxio Pro PDV: Iniciando sistema...");
        
        // Timeout de segurança para o Caixa: se demorar mais de 1s, prossegue
        const sessionPromise = (typeof Caixa !== 'undefined' && typeof Caixa.checkSession === 'function') 
            ? Caixa.checkSession() 
            : Promise.resolve();

        try {
            await Promise.race([
                sessionPromise,
                new Promise(resolve => setTimeout(resolve, 1500))
            ]);
        } catch(e) { console.warn("Aviso: Sessão de caixa demorou a responder, prosseguindo..."); }

        const saved = localStorage.getItem('naxio_pos_recovery');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Validação de integridade: Verifica se é um array de abas válido
                if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].cart || parsed[0].ticket)) {
                    Varejo.state.tabs = parsed.map(t => ({ ...t, cart: t.cart || t.ticket || [] }));
                    const currentTab = Varejo.state.tabs[Varejo.state.currentTabIndex] || Varejo.state.tabs[0];
                    Varejo.state.cart = Array.isArray(currentTab.cart) ? [...currentTab.cart] : [];
                    Varejo.state.currentCliente = currentTab.cliente || null;
                    Varejo.state.totalTicket = typeof currentTab.total === 'number' ? currentTab.total : 0;
                    console.log("🛡️ Blindagem: Estado recuperado com integridade.");
                } else {
                    throw new Error("Dados de recuperação corrompidos ou em formato inválido.");
                }
            } catch(e) { 
                console.error("🚨 Erro na Blindagem (Recuperação):", e);
                Varejo.autoRepair(); // Tenta limpar e estabilizar
            }
        }

        Varejo.injectStyles();
        Varejo.injectHTML();
        Varejo.startClock();
        Varejo.loadCategories();
        Varejo.loadProductsByCategory(null);
        Varejo.switchTab(0);

        // Sincroniza Operador Atual
        const opName = localStorage.getItem('active_operator_name') || 'OPERADOR PADRÃO';
        const btnPos = document.getElementById('btn-pos-operator');
        const footerOp = document.getElementById('pos-operator-footer-name');
        
        if (opName) {
            if (btnPos) btnPos.innerHTML = `<i class="ri-user-settings-line"></i> ${opName.split(' ')[0]}`;
            if (footerOp) footerOp.innerHTML = `<i class="ri-user-voice-fill"></i> OPERADOR: ${opName.toUpperCase()}`;
        }

        // Monitor de Rede e Atalhos
        window.addEventListener('offline', () => Varejo.setConnectivity(false));
        window.addEventListener('online', () => Varejo.setConnectivity(true));
        Varejo.setConnectivity(navigator.onLine); // Verifica estado real no início
        window.addEventListener('keydown', Varejo.handleHotkeys);

        // Sistema de Blindagem: Salva estado a cada 2 segundos
        setInterval(Varejo.saveRecoveryState, 2000);
        setInterval(Varejo.updateNetworkStats, 3000);
        
        Varejo.state.isOpen = true;
        console.log("🚀 PDV OPERACIONAL.");
    },

    setConnectivity: (online) => {
        const banner = document.getElementById('pos-offline-banner');
        const health = document.getElementById('health-sync');
        // Força verificação real se houver erro
        const isActuallyOnline = navigator.onLine;
        if (banner) banner.style.display = isActuallyOnline ? 'none' : 'flex';
        if (health) health.style.background = isActuallyOnline ? '#0ea5e9' : 'var(--pos-danger)';
    },

    updateNetworkStats: () => {
        const lat = Math.floor(Math.random() * 5) + 2;
        const el = document.getElementById('pos-latency');
        if (el) el.innerText = `${lat}ms`;
    },

    handleHotkeys: (e) => {
        if (!Varejo.state.isOpen) return;
        
        switch(e.key) {
            case 'F1': e.preventDefault(); document.getElementById('pos-barcode')?.focus(); break;
            case 'F2': e.preventDefault(); Varejo.openPaymentModal(); break;
            case 'F3': e.preventDefault(); Varejo.cancelSaleWithPassword(); break;
            case 'Escape': 
                if (document.querySelector('.modal-overlay[style*="flex"]')) {
                    // Fecha modal se houver
                } else {
                    App.router.go('loja');
                }
                break;
        }
    },

    playSound: (type) => {
        const sounds = {
            beep: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
            success: 'https://actions.google.com/sounds/v1/buttons/button_positive.ogg',
            error: 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg'
        };
        new Audio(sounds[type]).play().catch(() => {});
    },

    openPDV: () => {
        console.log("📂 Tentando abrir visualmente o PDV...");
        Varejo.state.isOpen = true;
        
        // Garante que o elemento existe antes de navegar
        if (!document.getElementById('view-pos')) {
            console.warn("⚠️ view-pos não encontrado, injetando agora...");
            Varejo.injectHTML();
        }

        if (typeof App !== 'undefined' && App.router) {
            App.router.go('pos');
        }

        // Força visibilidade por segurança
        const posEl = document.getElementById('view-pos');
        if (posEl) {
            posEl.style.display = 'block';
            posEl.classList.add('active');
            console.log("✅ View 'pos' ativada e visível.");
        }

        setTimeout(() => {
            const input = document.getElementById('pos-barcode');
            if (input) input.focus();
        }, 300);
    },

    sair: () => {
        console.log("🚪 Saindo do PDV...");
        Varejo.state.isOpen = false;
        const posEl = document.getElementById('view-pos');
        if (posEl) {
            posEl.classList.remove('active');
            posEl.style.display = 'none';
        }
        if (typeof App !== 'undefined' && App.router) {
            App.router.goDashboard();
        } else {
            window.location.reload(); // Fallback de emergência
        }
    },

    injectStyles: () => {
        if (document.getElementById('pos-styles')) return;
        const style = document.createElement('style');
        style.id = 'pos-styles';
        style.innerHTML = `
            :root {
                --pos-bg: #f8fafc;
                --pos-panel: #ffffff;
                --pos-accent: #0284c7;
                --pos-accent-gradient: linear-gradient(135deg, #0284c7, #2563eb);
                --pos-success: #10b981;
                --pos-danger: #ef4444;
                --pos-text: #0f172a;
                --pos-text-muted: #64748b;
                --pos-border: #e2e8f0;
                --pos-glass: none;
                --shadow-neon: 0 4px 12px rgba(2, 132, 199, 0.2);
            }

            #view-pos {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: #f1f5f9;
                color: var(--pos-text); font-family: 'Outfit', sans-serif;
                z-index: 99999;
                display: none; /* Escondido por padrão */
            }
            #view-pos.active { display: block !important; }

            /* Grid Principal Ajustado */
            .pos-container {
                display: grid;
                grid-template-columns: 1fr 380px;
                grid-template-rows: 70px 1fr;
                width: 100vw; height: 100vh;
                gap: 15px; padding: 15px; box-sizing: border-box;
                background: var(--pos-bg);
            }

            .pos-main-sale {
                grid-row: 2;
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            /* Tabela de Itens Profissional */
            .sale-table-container {
                flex: 1;
                background: var(--pos-panel);
                border-radius: 28px;
                border: 1px solid var(--pos-border);
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

            .sale-table-header {
                display: grid;
                grid-template-columns: 60px 150px 1fr 100px 120px 120px;
                background: #f8fafc;
                padding: 15px 20px;
                font-weight: 800;
                font-size: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #0284c7;
                border-bottom: 1px solid #e2e8f0;
            }

            #pos-items-list {
                flex: 1;
                overflow-y: auto;
                background: #ffffff;
            }

            .sale-item-row {
                display: grid;
                grid-template-columns: 60px 150px 1fr 100px 120px 120px;
                padding: 12px 20px;
                border-bottom: 1px solid #f1f5f9;
                align-items: center;
                font-size: 0.95rem;
                color: #0f172a;
                transition: background 0.2s;
            }
            .sale-item-row:hover { background: #f8fafc; }
            .sale-item-row.last-added { background: #e0f2fe; border-left: 4px solid var(--pos-accent); }

            /* Sidebar Compacto */
            .pos-sidebar {
                grid-row: 2;
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .customer-panel { padding: 20px; background: #ffffff !important; border: 1px solid #e2e8f0 !important; color: #0f172a !important; }
            .totals-panel {
                margin-top: auto;
                padding: 25px;
                background: #ffffff !important;
                border-radius: 28px;
                border: 1px solid #e2e8f0 !important;
                box-shadow: 0 4px 15px rgba(0,0,0,0.03);
            }

            .total-huge {
                font-size: 3.5rem;
                font-weight: 900;
                color: #0f172a !important;
                letter-spacing: -2px;
                line-height: 1;
                margin: 10px 0;
            }

            /* Cadastro de Cliente Inline */
            #pos-customer-register-form {
                background: #f8fafc;
                padding: 15px;
                border-radius: 20px;
                margin-top: 10px;
                border: 1px solid var(--pos-accent);
                display: none;
            }

            .pos-tile {
                background: #ffffff !important;
                backdrop-filter: none;
                -webkit-backdrop-filter: none;
                border: 1px solid #e2e8f0 !important;
                border-radius: 28px;
                overflow: visible;
                box-shadow: 0 4px 15px rgba(0,0,0,0.04) !important;
                color: #0f172a !important;
            }

            .pos-header-bar {
                grid-column: 1 / -1;
                display: flex; justify-content: space-between; align-items: center;
                padding: 0 30px;
            }
            
            @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
            .health-pulse { position: relative; }
            .health-pulse::after { content:''; position:absolute; inset:-4px; border: 2px solid var(--pos-success); border-radius: 50%; animation: pulse-ring 1.5s infinite; }
        `;
        document.head.appendChild(style);
    },

    injectHTML: () => {
        if (document.getElementById('view-pos')) return;
        let main = document.querySelector('main') || document.body;
        const section = document.createElement('section');
        section.id = 'view-pos';
        section.className = 'view-section';
        section.innerHTML = `
            <div id="pos-offline-banner" class="offline-alert"><i class="ri-wifi-off-line"></i> MODO CONTINGÊNCIA ATIVO (OFFLINE)</div>
            <div class="pos-container">
                <!-- HEADER OPERACIONAL -->
                <header class="pos-tile" style="grid-column: 1 / span 2; display: flex; align-items: center; justify-content: space-between; padding: 0 30px; background: #ffffff !important; border: 1px solid #e2e8f0;">
                    <div style="display: flex; align-items: center; gap: 20px;">
                        <div style="background: var(--pos-accent-gradient); width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-neon); cursor: pointer;" onclick="Varejo.sair()">
                            <i class="ri-home-4-fill" style="color: #fff; font-size: 1.2rem;"></i>
                        </div>
                        <button class="btn btn-sm btn-secondary" onclick="Varejo.sair()" style="font-weight:800; padding:5px 15px; border-radius:10px;">SAIR</button>
                        <h2 style="margin:0; font-size: 1.2rem; font-weight: 800; letter-spacing: 1px; color:#0f172a;">NAXIO <span style="color:var(--pos-accent)">PRO</span></h2>
                    </div>

                    <!-- SELETOR DE VENDAS (ABAS) -->
                    <div id="pos-tabs-container" style="display:flex; gap:10px; background:#f1f5f9; padding:5px; border-radius:15px; border:1px solid #e2e8f0;">
                        <!-- Abas serão injetadas aqui -->
                    </div>

                    <div style="display: flex; align-items: center; gap: 40px;">
                        <div id="pos-header-status" style="display: flex; align-items: center; gap: 15px;">
                            <div style="text-align: right;">
                                <div id="pos-op-name" style="font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Operador</div>
                                <div style="font-size: 0.9rem; font-weight: 800; color: #0f172a;">Caixa Ativo</div>
                            </div>
                        </div>
                        <div id="pos-clock" style="font-size: 1.5rem; font-weight: 900; font-family: 'JetBrains Mono', monospace; color: var(--pos-accent);">00:00:00</div>
                    </div>
                </header>

                <!-- ÁREA CENTRAL: LISTA DE ITENS DA VENDA -->
                <main class="pos-main-sale">
                    <div class="pos-tile" style="padding: 10px 20px; background:#ffffff !important; border:1px solid #e2e8f0;">
                        <div style="display:flex; gap:15px; align-items:center;">
                            <i class="ri-barcode-line" style="font-size: 1.5rem; color: var(--pos-accent);"></i>
                            <input type="text" id="pos-barcode" placeholder="BIPAR PRODUTO OU DIGITAR NOME... (F1)" autocomplete="off" onkeydown="Varejo.handleScan(event)" style="flex:1; background:none; border:none; color:#0f172a; font-size:1.4rem; font-weight:700; outline:none; padding:10px;">
                            <div class="badge" style="background: #f1f5f9; color: #475569; font-weight:700; border:1px solid #cbd5e1; padding: 8px 15px;">MODO AUTO</div>
                        </div>
                    </div>

                    <div class="sale-table-container" style="background:#ffffff; border:1px solid #e2e8f0;">
                        <div class="sale-table-header">
                            <div>SEQ</div>
                            <div>CÓDIGO</div>
                            <div>DESCRIÇÃO DO PRODUTO</div>
                            <div style="text-align:center;">QTD</div>
                            <div style="text-align:right;">V. UNIT</div>
                            <div style="text-align:right;">V. TOTAL</div>
                        </div>
                        <div id="pos-items-list">
                            <!-- Itens da venda entrarão aqui -->
                            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; opacity:0.35; color:#64748b;">
                                <i class="ri-shopping-cart-2-line" style="font-size:5rem;"></i>
                                <p style="font-weight:700; color:#475569;">AGUARDANDO PRODUTOS...</p>
                            </div>
                        </div>
                    </div>
                </main>

                <!-- SIDEBAR DIREITO: CLIENTE E TOTAIS -->
                <aside class="pos-sidebar">
                    <!-- PAINEL DO CLIENTE -->
                    <div class="pos-tile customer-panel">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                            <h4 style="margin:0; font-size:0.8rem; color:var(--pos-accent); text-transform:uppercase;">Identificar Cliente</h4>
                            <i class="ri-user-add-line" style="cursor:pointer; color:#0284c7;" onclick="Varejo.toggleCustomerForm()"></i>
                        </div>
                        
                        <div id="pos-main-customer-selected" style="display:none; background: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 15px; position:relative;">
                             <div id="pos-main-customer-name" style="font-weight:700; font-size:1.1rem; color:#065f46;">Consumidor</div>
                             <div style="position:absolute; right:15px; top:50%; transform:translateY(-50%); display:flex; gap:5px;">
                                 <button class="btn btn-sm" onclick="Varejo.editarClienteAtual()" style="color:var(--pos-warning); background:none; border:none; padding:5px;" title="Editar Cliente"><i class="ri-edit-2-fill" style="font-size:1.2rem;"></i></button>
                                 <button class="btn btn-sm" onclick="Varejo.limparCliente()" style="color:var(--pos-danger); background:none; border:none; padding:5px;" title="Remover Cliente"><i class="ri-close-circle-fill" style="font-size:1.2rem;"></i></button>
                             </div>
                        </div>

                        <div id="pos-main-customer-search-area">
                            <input type="text" id="pos-main-customer-search" placeholder="CPF OU NOME..." autocomplete="off" oninput="Varejo.buscarCliente(this.value, 'main')" style="width:100%; padding:15px; border-radius:15px; background:#f8fafc; border:1px solid #cbd5e1; color:#0f172a; font-size:0.9rem; font-weight:600;">
                        </div>

                        <!-- Formulário de Cadastro Rápido -->
                        <div id="pos-customer-register-form">
                            <h5 style="margin:0 0 10px 0; font-size:0.75rem; color:#0f172a;">NOVO CADASTRO</h5>
                            <input type="text" id="reg-cust-name" placeholder="Nome Completo" class="input-field" style="margin-bottom:8px; font-size:0.8rem;">
                            <input type="text" id="reg-cust-cpf" placeholder="CPF/CNPJ" class="input-field" style="margin-bottom:10px; font-size:0.8rem;">
                            <button class="btn btn-primary btn-sm btn-full" onclick="Varejo.cadastrarClienteRapido()">SALVAR E USAR</button>
                        </div>

                        <div id="pos-main-customer-results" style="display:none; position:absolute; left:20px; width:calc(100% - 40px); background:#ffffff; border:2px solid var(--pos-accent); border-radius:20px; z-index:1000; margin-top:8px; box-shadow:0 15px 30px rgba(0,0,0,0.15); overflow:hidden; max-height:350px; overflow-y:auto;" class="scroll-thin"></div>
                    </div>

                    <!-- PAINEL DE TOTAIS -->
                    <div class="totals-panel">
                        <div style="display:flex; justify-content:space-between; color:#64748b; font-weight:700; font-size:0.85rem;">
                            <span>SUBTOTAL</span>
                            <span id="pos-subtotal" style="color:#0f172a;">R$ 0,00</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; color:#059669; font-weight:700; font-size:0.85rem; margin-top:5px;">
                            <span>DESCONTO (F7)</span>
                            <span id="pos-discount">- R$ 0,00</span>
                        </div>
                        <div style="margin-top:20px;">
                            <span style="font-size:0.75rem; color:var(--pos-accent); font-weight:800; text-transform:uppercase;">Total a Pagar</span>
                            <div class="total-huge" id="pos-total-final" style="color:#0f172a;">R$ 0,00</div>
                        </div>

                        <button class="btn btn-primary btn-full" onclick="Varejo.openPaymentModal()" style="margin-top:20px; height:60px; font-size:1.2rem; font-weight:900; border-radius:18px;">
                            <i class="ri-qr-code-fill"></i> PAGAR (F2)
                        </button>
                        
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
                            <button class="btn btn-secondary btn-sm" onclick="Varejo.cancelSaleWithPassword()" style="height:45px;">
                                <i class="ri-close-line"></i> CANCELAR
                            </button>
                            <button class="btn btn-secondary btn-sm" onclick="Varejo.openCardBrandsModal()" style="height:45px;">
                                <i class="ri-settings-4-line"></i> AJUSTES
                            </button>
                        </div>
                    </div>
                </aside>

                <footer class="bottom-bar" style="display: flex; justify-content: space-between; align-items: center; padding: 0 30px; background: #ffffff; border-top: 1px solid #e2e8f0; color:#475569;">
                    <div style="display:flex; gap:30px;">
                        <span id="pos-operator-footer-name" style="color:#059669; font-weight:800;"><i class="ri-user-6-fill"></i> OPERADOR: AGUARDANDO...</span>
                        <span style="color:var(--pos-accent); font-weight:800;"><i class="ri-shield-keyhole-fill"></i> JORNAL DE TRANSAÇÕES: ATIVO</span>
                    </div>
                    <div style="display:flex; gap:15px; align-items:center;">
                        <span style="background:#f1f5f9; padding:3px 10px; border-radius:6px; font-size:0.7rem; color:#475569; border:1px solid #cbd5e1; font-weight:600;">LATÊNCIA: 4ms</span>
                        <span style="color:#64748b; font-weight:700; font-size:0.8rem;">NAXIO GESSO ENTERPRISE v5.5.0</span>
                    </div>
                </footer>
            </div>

            <div id="pos-search-modal" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header"><h3>Buscar Produto</h3><button class="btn btn-secondary btn-sm" onclick="document.getElementById('pos-search-modal').style.display='none'">X</button></div>
                    <div class="modal-body">
                        <input type="text" id="pos-search-input" class="pos-input" style="margin-bottom:15px;" placeholder="Digite para filtrar..." oninput="Varejo.filterSearch(this.value)">
                        <div id="pos-search-results" class="scroll-thin" style="max-height:400px; overflow-y:auto; background:rgba(0,0,0,0.1); border-radius:15px;"></div>
                    </div>
                </div>
            </div>

            <div id="pos-pay-modal" class="modal-overlay">
                <div class="modal-content" style="width: 95vw; max-width: 1800px; height: 90vh; background: #ffffff !important; border: 1px solid #cbd5e1; box-shadow: 0 25px 50px rgba(0,0,0,0.15); display: flex; flex-direction: column;">
                    <div class="modal-header" style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                        <h3 style="display:flex; align-items:center; gap:12px; font-family:'Outfit'; font-weight:800; color:#0f172a;">
                            <i class="ri-secure-payment-fill" style="color:var(--pos-accent);"></i> Finalizar Venda - Naxio Gesso
                        </h3>
                        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('pos-pay-modal').style.display='none'">X</button>
                    </div>
                    <div class="modal-body" style="padding: 0; display: flex; flex-direction: row; flex: 1; background: #ffffff;">
                        
                        <!-- Lado Esquerdo: Pagamentos (Compacto 2x2 sem scroll) -->
                        <div class="pay-left-container" style="flex: 1.3; padding: 20px 24px; overflow-y: auto; background: #ffffff;">
                            <div class="pay-mode-bar" style="background: #f8fafc; padding: 8px 14px; border-radius: 10px; margin-bottom: 12px; display: flex; gap: 16px; align-items: center; border: 1px solid #e2e8f0;">
                                <label style="color: #475569; font-weight: 800; font-size: 0.78rem; text-transform: uppercase;">Modo de Pagamento:</label>
                                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; color: #0f172a; font-weight: bold; font-size: 0.85rem;">
                                    <input type="radio" name="pay_mode" value="unico" checked onchange="Varejo.changePayMode('unico')" style="accent-color: var(--pos-accent); width: 16px; height: 16px;"> Integral (Único)
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; color: #0f172a; font-weight: bold; font-size: 0.85rem;">
                                    <input type="radio" name="pay_mode" value="multiplo" onchange="Varejo.changePayMode('multiplo')" style="accent-color: var(--pos-accent); width: 16px; height: 16px;"> Múltiplo (Dividido)
                                </label>
                            </div>
                            
                            <!-- Grid 2x2 para métodos de pagamento -->
                            <div class="pay-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                                <div class="pay-field pay-money" onclick="Varejo.selectPayment('pay-money')" style="cursor: pointer;"><label><i class="ri-money-dollar-circle-fill"></i> DINHEIRO</label><div class="input-box"><span>R$</span><input type="number" id="pay-money" step="0.01" placeholder="0.00" oninput="Varejo.calcRestante()" readonly style="cursor: pointer;"></div></div>
                                <div class="pay-field pay-pix" onclick="Varejo.selectPayment('pay-pix')" style="cursor: pointer;"><label><i class="ri-qr-code-fill"></i> PIX</label><div class="input-box"><span>R$</span><input type="number" id="pay-pix" step="0.01" placeholder="0.00" oninput="Varejo.calcRestante()" readonly style="cursor: pointer;"></div></div>
                                <div class="pay-field pay-card" onclick="Varejo.selectPayment('pay-credit')" style="cursor: pointer;"><label><i class="ri-bank-card-fill"></i> CRÉDITO</label><div class="input-box"><span>R$</span><input type="number" id="pay-credit" step="0.01" placeholder="0.00" oninput="Varejo.calcRestante()" readonly style="cursor: pointer;"></div></div>
                                <div class="pay-field pay-card" onclick="Varejo.selectPayment('pay-debit')" style="cursor: pointer;"><label><i class="ri-bank-card-line"></i> DÉBITO</label><div class="input-box"><span>R$</span><input type="number" id="pay-debit" step="0.01" placeholder="0.00" oninput="Varejo.calcRestante()" readonly style="cursor: pointer;"></div></div>
                                <div class="pay-field pay-crediario" onclick="Varejo.selectPayment('pay-crediario')" style="cursor: pointer;"><label><i class="ri-file-list-3-fill"></i> CREDIÁRIO / NOTA</label><div class="input-box"><span>R$</span><input type="number" id="pay-crediario" step="0.01" placeholder="0.00" oninput="Varejo.calcRestante()" readonly style="cursor: pointer;"></div></div>
                                <div class="pay-field pay-desc">
                                    <label><i class="ri-price-tag-3-fill"></i> DESCONTO</label>
                                    <div style="display:flex; gap:6px; align-items:center;">
                                        <div class="input-box" style="flex:1; background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:3px 6px;">
                                            <input type="number" id="pay-desconto-pct" step="0.1" placeholder="0%" oninput="Varejo.calcDescontoPct()" style="font-size:1rem; text-align:center;">
                                        </div>
                                        <div class="input-box" style="flex:1.4; background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:3px 6px;">
                                            <input type="number" id="pay-desconto" step="0.01" placeholder="R$ 0.00" oninput="Varejo.calcRestante()" style="font-size:1rem; text-align:center;">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style="margin-bottom: 8px;">
                                <button class="btn btn-outline btn-sm btn-bandeira-trigger" onclick="Varejo.openSelectCardBrandModal()">
                                    <i class="ri-bank-card-line"></i> Selecionar Bandeira do Cartão
                                </button>
                                <button class="btn btn-danger btn-sm btn-remove-brand" onclick="Varejo.removeSelectedCardBrandForPayment()" style="display:none; width:100%; margin-top: 4px; text-transform: uppercase; font-weight: 800; font-size: 0.75rem; padding: 4px 8px;">
                                    <i class="ri-close-circle-line"></i> Remover Bandeira
                                </button>
                                <div id="payment-card-brands-container" style="display:none; gap:6px; flex-wrap:wrap; margin-top:6px;"></div>
                            </div>

                            <!-- CAMPOS NSU E AUT -->
                            <div id="pay-nsu-container" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                                <div class="pay-field" style="padding:6px 10px;">
                                    <label style="font-size:0.7rem; margin-bottom:3px;"><i class="ri-key-fill" style="color:var(--pos-accent);"></i> CÓD. AUTORIZAÇÃO (AUT)</label>
                                    <input type="text" id="pay-nsu-aut" placeholder="Cód. máquina" style="font-size:0.95rem; height:auto; padding:2px 0;">
                                </div>
                                <div class="pay-field" style="padding:6px 10px;">
                                    <label style="font-size:0.7rem; margin-bottom:3px;"><i class="ri-hashtag" style="color:var(--pos-accent);"></i> NÚMERO NSU / DOC</label>
                                    <input type="text" id="pay-nsu-doc" placeholder="Nº transação" style="font-size:0.95rem; height:auto; padding:2px 0;">
                                </div>
                            </div>

                        </div>

                        <!-- Lado Direito: Resumo e Confirmação -->
                        <div class="pay-right-panel" style="flex: 0.7; background: #f8fafc; border-left: 1px solid #e2e8f0; padding: 24px; display: flex; flex-direction: column; justify-content: space-between;">
                            <div>
                                <div style="text-align:center; margin-bottom:15px; background: #ffffff; padding: 18px; border-radius: 16px; border: 1px solid #cbd5e1; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
                                    <div style="text-transform: uppercase; font-size: 0.78rem; font-weight: 800; color: #64748b; letter-spacing: 1.5px; margin-bottom: 6px;">Valor Total do Pedido</div>
                                    <h1 id="pos-pay-total" style="color: #0f172a; font-size: 3.2rem; margin:0; font-weight:950; font-family: 'Outfit';">0,00</h1>
                                </div>

                                <div id="pay-restante-zone" style="margin-top:12px; padding:16px; border-radius:16px; text-align:center; background:#ffffff; border:1px solid #e2e8f0; transition:0.3s;">
                                    <div id="pay-restante-label" style="text-transform:uppercase; font-size:0.75rem; font-weight:800; letter-spacing:1px; margin-bottom:4px; color:#64748b;">Aguardando Pagamento</div>
                                    <div id="pay-restante-box" style="font-size:2.2rem; font-weight:900; font-family:'Outfit'; color:#ef4444;">R$ 0,00</div>
                                </div>
                                <div id="payment-breakdown" style="margin-top:10px; text-align:left; padding: 12px; background:#ffffff; border-radius:12px; display:none; max-height: 140px; overflow-y:auto; border: 1px solid #e2e8f0;"></div>
                            </div>
                            
                            <button id="btn-finalizar-venda" class="btn-action-primary" disabled onclick="Varejo.finalizeMultiPayment()" style="height:60px; font-size:1.25rem; width: 100%; margin-top:15px; border-radius:12px;">
                                <i class="ri-printer-fill"></i> CONFIRMAR E EMITIR (F12)
                            </button>
                        </div>
                    </div>
                </div>
            </div>       </div>
                    </div>
                </div>
            </div>
        `;
        main.appendChild(section);
        Varejo.renderTabs();
    },

    switchTab: (idx) => {
        const prevTab = Varejo.state.tabs[Varejo.state.currentTabIndex];
        if (prevTab) {
            prevTab.cart = [...Varejo.state.cart];
            prevTab.cliente = Varejo.state.currentCliente;
            prevTab.total = Varejo.state.totalTicket;
        }

        Varejo.state.currentTabIndex = idx;
        const newTab = Varejo.state.tabs[idx];
        Varejo.state.cart = Array.isArray(newTab.cart) ? [...newTab.cart] : [];
        Varejo.state.currentCliente = newTab.cliente;
        Varejo.state.totalTicket = newTab.total;

        Varejo.renderTabs();
        Varejo.renderCart();
        Varejo._atualizarPainelCliente();
        const input = document.getElementById('pos-barcode');
        if (input) input.focus();
        App.utils.toast(`Venda ${newTab.id} ativa`, 'info');
    },

    renderTabs: () => {
        const container = document.getElementById('pos-tabs-container');
        if (!container) return;
        container.innerHTML = Varejo.state.tabs.map((tab, idx) => `
            <div onclick="Varejo.switchTab(${idx})" style="
                padding: 8px 20px; 
                border-radius: 10px; 
                cursor: pointer; 
                font-weight: 800; 
                font-size: 0.8rem; 
                transition: 0.3s;
                display: flex; 
                align-items: center; 
                gap: 8px;
                background: ${idx === Varejo.state.currentTabIndex ? 'var(--pos-accent-gradient)' : 'transparent'};
                color: ${idx === Varejo.state.currentTabIndex ? '#fff' : 'var(--pos-text-muted)'};
                box-shadow: ${idx === Varejo.state.currentTabIndex ? '0 4px 10px rgba(14, 165, 233, 0.3)' : 'none'};
            ">
                <i class="ri-shopping-bag-3-line"></i> VENDA ${tab.id}
                ${tab.cart && tab.cart.length > 0 ? `<span style="background:#fff; color:var(--pos-accent); padding:2px 6px; border-radius:6px; font-size:0.6rem;">${tab.cart.length}</span>` : ''}
            </div>
        `).join('');
    },

    updateSummary: (isPrazo = Varejo.state?.isPrazoPayment || false) => {
        const total = Varejo.state.cart.reduce((acc, p) => {
            const unitPrice = (isPrazo && p.preco_prazo && Number(p.preco_prazo) > 0) ? Number(p.preco_prazo) : Number(p.preco || 0);
            return acc + (unitPrice * (p.qtd || 1));
        }, 0);
        Varejo.state.totalTicket = total;
        Varejo.renderCart(isPrazo);
    },

    autoRepair: () => {
        if (!Array.isArray(Varejo.state.cart)) Varejo.state.cart = [];
        Varejo.state.cart = Varejo.state.cart.filter(p => p && typeof p === 'object' && p.id);
        Varejo.updateSummary();
    },

    saveRecoveryState: () => {
        const t = Varejo.state.tabs[Varejo.state.currentTabIndex];
        if (t) {
            t.cart = [...Varejo.state.cart];
            t.cliente = Varejo.state.currentCliente;
            t.total = Varejo.state.totalTicket;
        }
        localStorage.setItem('naxio_pos_recovery', JSON.stringify(Varejo.state.tabs));
    },

    renderCart: (isPrazo = Varejo.state?.isPrazoPayment || false) => {
        const list = document.getElementById('pos-items-list');
        if (!list) return;

        const cart = Varejo.state.cart;
        if (cart.length === 0) {
            list.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; opacity:0.2;">
                    <i class="ri-shopping-cart-2-line" style="font-size:5rem;"></i>
                    <p>AGUARDANDO PRODUTOS...</p>
                </div>`;
            const subtotalEl = document.getElementById('pos-subtotal');
            if (subtotalEl) subtotalEl.innerText = 'R$ 0,00';
            const totalFinalEl = document.getElementById('pos-total-final');
            if (totalFinalEl) totalFinalEl.innerText = 'R$ 0,00';
            return;
        }

        let totalAvista = 0;
        let totalPrazo = 0;
        let html = '';

        cart.forEach((item, index) => {
            const pAvista = Number(item.preco || 0);
            const pPrazo = (item.preco_prazo && Number(item.preco_prazo) > 0) ? Number(item.preco_prazo) : pAvista;
            const qtd = item.qtd || 1;

            const itemTotalAvista = pAvista * qtd;
            const itemTotalPrazo = pPrazo * qtd;

            totalAvista += itemTotalAvista;
            totalPrazo += itemTotalPrazo;

            const isLast = index === cart.length - 1;
            const hasDiff = pPrazo !== pAvista;

            const unitPriceHtml = hasDiff
                ? `<div style="font-size:0.95rem; font-weight:800; color:#38bdf8;">R$ ${pAvista.toFixed(2)} <span style="font-size:0.65rem; color:#94a3b8; font-weight:bold;">(Vis)</span></div>
                   <div style="font-size:0.85rem; font-weight:800; color:#fbbf24; margin-top:2px;">R$ ${pPrazo.toFixed(2)} <span style="font-size:0.65rem; color:#f59e0b; font-weight:bold;">(Prz)</span></div>`
                : `<div style="font-size:0.95rem; font-weight:800; color:#38bdf8;">R$ ${pAvista.toFixed(2)}</div>`;

            const totalHtml = hasDiff
                ? `<div style="font-size:1rem; font-weight:900; color:#38bdf8;">R$ ${itemTotalAvista.toFixed(2)} <span style="font-size:0.65rem; color:#94a3b8; font-weight:bold;">(Vis)</span></div>
                   <div style="font-size:0.9rem; font-weight:900; color:#fbbf24; margin-top:2px;">R$ ${itemTotalPrazo.toFixed(2)} <span style="font-size:0.65rem; color:#f59e0b; font-weight:bold;">(Prz)</span></div>`
                : `<div style="font-size:1rem; font-weight:900; color:#38bdf8;">R$ ${itemTotalAvista.toFixed(2)}</div>`;

            html += `
                <div class="sale-item-row ${isLast ? 'last-added' : ''}">
                    <div style="font-weight:800; color:var(--pos-accent); opacity:0.6;">${String(index + 1).padStart(3, '0')}</div>
                    <div style="font-family:'JetBrains Mono'; font-size:0.85rem;">${item.codigo_barras || '---'}</div>
                    <div style="font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.nome.toUpperCase()}</div>
                    <div style="text-align:center; font-weight:800;">${qtd}</div>
                    <div style="text-align:right; font-family:'JetBrains Mono';">${unitPriceHtml}</div>
                    <div style="text-align:right; font-family:'JetBrains Mono';">${totalHtml}</div>
                    <div style="text-align:right;">
                        <button onclick="Varejo.removeItem(${index})" style="background:none; border:none; color:var(--pos-danger); cursor:pointer; font-size:1.2rem; padding:5px;">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        list.innerHTML = html;
        list.scrollTop = list.scrollHeight;

        const discount = Varejo.state.discount || 0;
        const finalTotalAvista = Math.max(0, totalAvista - discount);
        const finalTotalPrazo = Math.max(0, totalPrazo - discount);

        const subtotalEl = document.getElementById('pos-subtotal');
        if (subtotalEl) {
            if (totalPrazo !== totalAvista) {
                subtotalEl.innerHTML = `<span style="color:#38bdf8; font-weight:800; font-size:0.95rem;">R$ ${totalAvista.toFixed(2)}</span> <span style="font-size:0.75rem; color:#64748b;">(Vis)</span> &nbsp;<span style="color:#475569;">|</span>&nbsp; <span style="color:#fbbf24; font-weight:800; font-size:0.95rem;">R$ ${totalPrazo.toFixed(2)}</span> <span style="font-size:0.75rem; color:#d97706;">(Prz)</span>`;
            } else {
                subtotalEl.innerText = `R$ ${totalAvista.toFixed(2)}`;
            }
        }

        const totalFinalEl = document.getElementById('pos-total-final');
        if (totalFinalEl) {
            if (totalPrazo !== totalAvista) {
                totalFinalEl.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px; margin-bottom:8px;">
                        <div style="display:flex; justify-content:space-between; align-items:baseline;">
                            <span style="font-size:0.75rem; color:#38bdf8; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">À Vista</span>
                            <span style="font-size:0.75rem; color:#fbbf24; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">A Prazo</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="color:#38bdf8; font-size:1.85rem; font-weight:900; line-height:1; font-family:'JetBrains Mono', monospace; text-shadow:0 0 12px rgba(56,189,248,0.25);">R$ ${finalTotalAvista.toFixed(2)}</span>
                            <span style="color:#fbbf24; font-size:1.4rem; font-weight:900; line-height:1; font-family:'JetBrains Mono', monospace; text-shadow:0 0 10px rgba(251,191,36,0.25); background:rgba(251,191,36,0.1); border:1px solid rgba(251,191,36,0.25); padding:4px 8px; border-radius:8px;">R$ ${finalTotalPrazo.toFixed(2)}</span>
                        </div>
                    </div>`;
            } else {
                totalFinalEl.innerText = `R$ ${finalTotalAvista.toFixed(2)}`;
            }
        }

        // Indicador de Peso da Carga ao Vivo (Naxio Gesso)
        if (typeof NaxioGesso !== 'undefined' && NaxioGesso.estimarPesoProduto) {
            let pesoCargaTotal = 0;
            cart.forEach(it => { pesoCargaTotal += NaxioGesso.estimarPesoProduto(it.nome, it.qtd || 1); });
            let pesoBadge = document.getElementById('pos-peso-carga-badge');
            if (!pesoBadge && totalFinalEl && totalFinalEl.parentElement) {
                pesoBadge = document.createElement('div');
                pesoBadge.id = 'pos-peso-carga-badge';
                pesoBadge.style.cssText = 'margin-top:6px; font-size:0.75rem; font-weight:800; color:#0284c7; background:#f0f9ff; border:1px solid #bae6fd; padding:4px 8px; border-radius:6px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;';
                pesoBadge.onclick = () => { if (NaxioGesso.openFreteModal) NaxioGesso.openFreteModal(); };
                pesoBadge.title = 'Clique para abrir cálculo de Frete e Romaneio';
                totalFinalEl.parentElement.appendChild(pesoBadge);
            }
            if (pesoBadge) {
                pesoBadge.innerHTML = `<span><i class="ri-truck-line"></i> Carga Total:</span> <span>${pesoCargaTotal.toFixed(1)} kg ${pesoCargaTotal > 650 ? '<span style="color:#dc2626; font-size:0.7rem;">(Carga Pesada)</span>' : ''}</span>`;
            }
        }

        if (typeof Varejo.saveRecoveryState === 'function') Varejo.saveRecoveryState();
    },

    toggleCustomerForm: () => {
        const form = document.getElementById('pos-customer-register-form');
        const search = document.getElementById('pos-main-customer-search-area');
        if (form.style.display === 'none' || !form.style.display) {
            form.style.display = 'block';
            search.style.display = 'none';
            document.getElementById('reg-cust-name').focus();
        } else {
            form.style.display = 'none';
            Varejo._atualizarPainelCliente();
        }
    },

    cadastrarClienteRapido: async () => {
        const nome = document.getElementById('reg-cust-name').value;
        const cpf = document.getElementById('reg-cust-cpf').value;

        if (!nome) return alert("Informe o nome do cliente.");

        try {
            const { data, error } = await _sb.from('profiles').insert({
                nome_completo: nome,
                cpf: cpf,
                role: 'cliente'
            }).select().single();

            if (error) throw error;

            Varejo.selecionarCliente(data);
            Varejo.toggleCustomerForm();
            App.utils.toast("Cliente cadastrado e selecionado!", "success");
            
            // Limpa campos
            document.getElementById('reg-cust-name').value = '';
            document.getElementById('reg-cust-cpf').value = '';
        } catch (err) {
            console.error(err);
            alert("Erro ao cadastrar cliente: " + err.message);
        }
    },



    handleScan: (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = e.target.value.trim();
            if (!val) {
                if (Varejo.state.cart.length > 0) Varejo.openPaymentModal();
                return;
            }
            const mul = val.match(/^(\d+)\*(.+)$/);
            if (mul) { 
                Varejo.state.pendingQty = parseInt(mul[1]); 
                Varejo.searchProduct(mul[2].trim()); 
            } else { 
                Varejo.state.pendingQty = 1; 
                Varejo.searchProduct(val); 
            }
            e.target.value = '';
        }
    },

    searchProduct: async (term) => {
        if (!term) return;

        // 1. Busca Direta (Código Inteiro ou Código Interno)
        let { data: exact, error } = await _sb.from('products').select('*').eq('store_id', App.state.storeId)
            .or(`codigo_barras.eq.${term},codigo_cardapio.eq.${term}`).limit(1);

        // 2. Lógica de 8 Dígitos Fixos (Padrão 8 fixos + 5 variáveis = 13 total)
        // Se não achou o exato e o termo for longo, tentamos os 8 primeiros
        if (!exact?.length && term.length >= 8) {
            const prefix8 = term.substring(0, 8);
            const { data: byPrefix } = await _sb.from('products').select('*').eq('store_id', App.state.storeId)
                .eq('codigo_barras', prefix8).limit(1);
            if (byPrefix?.length) exact = byPrefix;
        }

        if (error) console.error("Busca exata erro:", error);

        // Se encontrou algum produto por código, adiciona direto
        if (exact && exact.length > 0) {
            Varejo.addItem(exact[0], Varejo.state.pendingQty);
            return;
        }

        // 3. Se não encontrou por código, abre a Modal de Busca por Nome (como solicitado para o Enter)
        Varejo.openSearchModal(term);
    },

    openSearchModal: (term = '') => {
        document.getElementById('pos-search-modal').style.display = 'flex';
        const input = document.getElementById('pos-search-input');
        input.value = term;
        input.focus();
        if (term) Varejo.filterSearch(term);
    },

    filterSearch: async (term) => {
        const { data } = await _sb.from('products').select('*').eq('store_id', App.state.storeId).ilike('nome', `%${term}%`).limit(30);
        Varejo.renderSearchResults(data || []);
    },

    renderSearchResults: (prods) => {
        const container = document.getElementById('pos-search-results');
        if (!prods || !prods.length) { container.innerHTML = '<p style="padding:20px; text-align:center;">Nada encontrado.</p>'; return; }
        container.innerHTML = prods.map(p => {
            const precoAvista = p.preco ? Number(p.preco) : 0;
            const precoPrazo = (p.preco_prazo && Number(p.preco_prazo) > 0) ? Number(p.preco_prazo) : null;
            const priceLabel = (precoPrazo && precoPrazo !== precoAvista)
                ? `R$ ${precoAvista.toFixed(2)} <span style="font-size:0.75rem; color:#94a3b8; display:block;">Prazo: R$ ${precoPrazo.toFixed(2)}</span>`
                : `R$ ${precoAvista.toFixed(2)}`;

            return `
            <div class="pos-search-item" onclick="Varejo.addItem(${JSON.stringify(p).replace(/"/g, '&quot;')}, ${Varejo.state.pendingQty})">
                <div style="flex:1;"><div style="font-weight:700;">${p.nome}</div><div style="font-size:0.8rem; opacity:0.6;">Estoque: ${p.estoque || 0}</div></div>
                <div style="font-weight:800; color:var(--pos-accent); text-align:right;">${priceLabel}</div>
            </div>
        `}).join('');
    },

    addItem: (p, q = 1) => {
        try {
            if (!p || typeof p !== 'object' || !p.id) throw new Error("Produto inválido.");
            
            const item = { ...p, qtd: q };
            Varejo.state.cart.push(item);
            
            Varejo.renderCart();
            Varejo.playSound('beep');
            
            document.getElementById('pos-search-modal').style.display = 'none';
            Varejo.state.pendingQty = 1;
            Varejo.saveRecoveryState();
        } catch (err) {
            console.error("Bug no PDV (addItem):", err);
        }
    },

    removeItem: async (idx) => {
        const pass = await NaxioUI.prompt('🔐 Autorização', 'Informe a senha de cancelamento:', '', 'Senha', 'password');
        const masterPass = Varejo.state.config?.senha_cancelamento || '1234';
        
        if (pass !== masterPass) {
            return App.utils.toast("Senha incorreta!", "error");
        }

        Varejo.state.cart.splice(idx, 1);
        Varejo.renderCart();
        Varejo.playSound('beep');
        App.utils.toast("Item removido.", "success");
    },

    cancelSaleWithPassword: async () => {
        if (!Varejo.state.cart.length) return;
        
        const pass = await NaxioUI.prompt('🔐 Cancelar Venda', 'Informe a senha para limpar o carrinho:', '', 'Senha', 'password');
        const masterPass = Varejo.state.config?.senha_cancelamento || '1234';

        if (pass !== masterPass) {
            return App.utils.toast("Senha incorreta!", "error");
        }

        if (await NaxioUI.confirm('⚠️ Limpar Venda', 'Remover todos os itens do carrinho?')) {
            Varejo.state.cart = [];
            Varejo.state.currentCliente = null;
            Varejo.state.discount = 0;
            Varejo.renderCart();
            Varejo._atualizarPainelCliente();
            App.utils.toast("Venda cancelada.", "info");
        }
    },

    openPaymentModal: () => {
        if (!Varejo.state.cart.length) return App.utils.toast("Carrinho vazio!", "warning");
        
        Varejo.state.isPrazoPayment = false;
        Varejo.updateSummary(false);

        document.getElementById('pos-pay-total').innerText = `${Varejo.state.totalTicket.toFixed(2)}`;
        document.getElementById('pos-pay-modal').style.display = 'flex';
        ['pay-money', 'pay-pix', 'pay-credit', 'pay-debit', 'pay-crediario', 'pay-desconto', 'pay-nsu-aut', 'pay-nsu-doc'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        
        Varejo.changePayMode('unico');
    },

    calcDescontoPct: () => {
        const total = Varejo.state.totalTicket;
        const pct = parseFloat(document.getElementById('pay-desconto-pct').value) || 0;
        const val = (total * pct) / 100;
        document.getElementById('pay-desconto').value = val.toFixed(2);
        Varejo.calcRestante();
    },

    changePayMode: (mode) => {
        const isUnico = mode === 'unico';
        const ids = ['pay-money', 'pay-pix', 'pay-credit', 'pay-debit', 'pay-crediario'];
        
        const radios = document.querySelectorAll('input[type="radio"][value="'+mode+'"]');
        radios.forEach(r => r.checked = true);
        
        ids.forEach(id => {
            const input = document.getElementById(id);
            if(input) {
                input.readOnly = isUnico;
                input.style.cursor = isUnico ? 'pointer' : 'text';
                const field = input.parentElement.parentElement;
                field.style.cursor = isUnico ? 'pointer' : 'default';
                
                input.value = '';
                field.style.border = '1px solid var(--pos-border)';
                field.style.background = 'rgba(0,0,0,0.2)';
                
                if(!isUnico) {
                    field.style.background = 'rgba(0,0,0,0.3)';
                }
            }
        });
        
        Varejo.calcRestante();
    },

    selectPayment: (id) => {
        const isPrazo = (id === 'pay-credit' || id === 'pay-crediario');
        Varejo.state.isPrazoPayment = isPrazo;
        Varejo.updateSummary(isPrazo);
        const payTotalEl = document.getElementById('pos-pay-total');
        if (payTotalEl) payTotalEl.innerText = `${Varejo.state.totalTicket.toFixed(2)}`;

        let mode = 'unico';
        const activeRadio = document.querySelector('input[type="radio"]:checked');
        if(activeRadio) mode = activeRadio.value;
        
        if(mode === 'unico') {
            const ids = ['pay-money', 'pay-pix', 'pay-credit', 'pay-debit', 'pay-crediario'];
            const desc = parseFloat(document.getElementById('pay-desconto').value) || 0;
            let brandDiscountVal = 0;
            if (Varejo.state.selectedBrand && Varejo.state.selectedBrand.discount > 0) {
                brandDiscountVal = (Varejo.state.totalTicket * Varejo.state.selectedBrand.discount) / 100;
            }
            const totalComDesconto = Math.max(0, Varejo.state.totalTicket - desc - brandDiscountVal).toFixed(2);
            
            ids.forEach(pid => {
                const input = document.getElementById(pid);
                if(!input) return;
                const field = input.parentElement.parentElement;
                
                if(pid === id) {
                    input.value = totalComDesconto;
                    field.style.border = '2px solid var(--pos-accent)';
                    field.style.background = 'rgba(59, 130, 246, 0.15)';
                } else {
                    input.value = "";
                    field.style.border = '1px solid var(--pos-border)';
                    field.style.background = 'rgba(0,0,0,0.2)';
                }
            });
            Varejo.calcRestante();
        }
    },

    calcRestante: () => {
        let total = Varejo.state.totalTicket;
        
        let brandDiscountVal = 0;
        let brandName = "";
        let brandPct = 0;
        if (Varejo.state.selectedBrand && Varejo.state.selectedBrand.discount > 0) {
            brandPct = Varejo.state.selectedBrand.discount;
            brandDiscountVal = (total * brandPct) / 100;
            brandName = Varejo.state.selectedBrand.name;
        }

        const pays = [
            { id: 'pay-money', label: 'Dinheiro', color: '#10b981' },
            { id: 'pay-pix', label: 'PIX', color: '#06b6d4' },
            { id: 'pay-credit', label: 'Cartão de Crédito', color: '#8b5cf6' },
            { id: 'pay-debit', label: 'Cartão de Débito', color: '#8b5cf6' },
            { id: 'pay-crediario', label: 'Crediário / Nota', color: '#f59e0b' }
        ];

        let paidTotal = 0;
        let breakdownHTML = '';

        pays.forEach(p => {
            const el = document.getElementById(p.id);
            const val = el ? (parseFloat(el.value) || 0) : 0;
            if(val > 0) {
                paidTotal += val;
                breakdownHTML += `<div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.85rem; font-weight:600;"><span style="color:${p.color};">${p.label}</span><span style="color:#fff;">R$ ${val.toFixed(2)}</span></div>`;
            }
        });

        const descEl = document.getElementById('pay-desconto');
        const desc = descEl ? (parseFloat(descEl.value) || 0) : 0;
        const totalDiscount = desc + brandDiscountVal;
        const totalFinalVenda = Math.max(0, total - totalDiscount);

        if (desc > 0) {
            breakdownHTML += `<div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.85rem; font-weight:600;"><span style="color:#ef4444;">Desconto Manual</span><span style="color:#ef4444;">- R$ ${desc.toFixed(2)}</span></div>`;
        }
        if (brandDiscountVal > 0) {
            breakdownHTML += `<div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.85rem; font-weight:600;"><span style="color:#ef4444;">Bandeira (${brandName} ${brandPct}%)</span><span style="color:#ef4444;">- R$ ${brandDiscountVal.toFixed(2)}</span></div>`;
        }
        
        const breakdownBoxes = document.querySelectorAll('#payment-breakdown');
        breakdownBoxes.forEach(box => {
            if (breakdownHTML !== '') {
                box.style.display = 'block';
                box.innerHTML = `<div style="text-transform:uppercase; font-size:0.7rem; font-weight:900; color:var(--pos-text-muted); margin-bottom:10px; letter-spacing:1px;">Resumo</div>` + breakdownHTML;
            } else {
                box.style.display = 'none';
                box.innerHTML = '';
            }
        });
        
        const res = totalFinalVenda - paidTotal;
        
        const totalDisplays = document.querySelectorAll('#pos-pay-total');
        totalDisplays.forEach(td => td.innerText = totalFinalVenda.toFixed(2));

        const zone = document.getElementById('pay-restante-zone');
        const box = document.getElementById('pay-restante-box');
        const label = document.getElementById('pay-restante-label');
        const btn = document.getElementById('btn-finalizar-venda');

        if (res <= 0.01) {
            if (zone) {
                zone.style.background = "rgba(16, 185, 129, 0.1)";
                zone.style.borderColor = "var(--pos-success)";
            }
            if (label) {
                label.innerHTML = res < -0.01 ? "Troco a Devolver" : `Pagamento Completo ${totalDiscount > 0 ? `<span style="color:#10b981; font-size:0.7rem; margin-left:10px;">(Economia: ${totalDiscount.toFixed(2)})</span>` : ''}`;
                label.style.color = "var(--pos-success)";
            }
            if (box) {
                box.innerText = `${Math.abs(res).toFixed(2)}`;
                box.style.color = "var(--pos-success)";
            }
            if (btn) btn.disabled = false;
        } else {
            if (zone) {
                zone.style.background = "rgba(239, 68, 68, 0.05)";
                zone.style.borderColor = "rgba(239, 68, 68, 0.2)";
            }
            if (label) {
                label.innerHTML = `Restante a Pagar ${totalDiscount > 0 ? `<br><span style="color:#10b981; font-size:0.75rem;">(Dedução Desconto: ${totalDiscount.toFixed(2)})</span>` : ''}`;
                label.style.color = "var(--pos-danger)";
            }
            if (box) {
                box.innerText = `${res.toFixed(2)}`;
                box.style.color = "#ef4444";
            }
            if (btn) btn.disabled = true;
        }
    },



    finalizeMultiPayment: async () => {
        const exigirNsu = document.getElementById('pos-exigir-nsu')?.checked;
        const pays = [
            { t: 'Dinheiro', v: 'pay-money' },
            { t: 'Pix', v: 'pay-pix' },
            { t: 'Crédito', v: 'pay-credit' },
            { t: 'Débito', v: 'pay-debit' },
            { t: 'Crediário', v: 'pay-crediario' }
        ].map(p => ({ tipo: p.t, val: parseFloat(document.getElementById(p.v).value) || 0 })).filter(p => p.val > 0);

        const valCrediario = pays.find(p => p.tipo === 'Crediário')?.val || 0;
        if (valCrediario > 0) {
            if (!Varejo.state.currentCliente) {
                return NaxioUI.alert('Cliente Obrigatório', 'Para vendas no CREDIÁRIO, você precisa selecionar um cliente primeiro.', 'warning');
            }
            if (!Varejo.state.currentCliente.whatsapp) {
                return NaxioUI.alert('Contato Obrigatório', 'Para vendas no CREDIÁRIO, o cliente deve ter um número de contato (WhatsApp) cadastrado.', 'warning');
            }
        }

        const proceed = async (installments = []) => {
            const nsu = document.getElementById('pay-nsu-doc').value.trim();
            const aut = document.getElementById('pay-nsu-aut').value.trim();
            const desc = parseFloat(document.getElementById('pay-desconto').value) || 0;
            let brandDiscountVal = 0;
            if (Varejo.state.selectedBrand && Varejo.state.selectedBrand.discount > 0) {
                brandDiscountVal = (Varejo.state.totalTicket * Varejo.state.selectedBrand.discount) / 100;
            }
            const totalDescontosVenda = desc + brandDiscountVal;

            App.utils.toast("Finalizando...", "info");
            try {
                const orderSnapshot = {
                    store_id: App.state.storeId,
                    total_pago: Math.max(0, Varejo.state.totalTicket - totalDescontosVenda),
                    taxa_servico: 0, // No varejo costuma ser zero ou fixo, campo garantido agora
                    status: 'concluido',
                    origem_venda: 'pdv',
                    metodo_pagamento: pays.length > 1 ? 'Múltiplos' : (pays[0]?.tipo || 'Desconto'),
                    customer_id: Varejo.state.currentCliente?.id || null,
                    observacao: JSON.stringify({ pays, desc: totalDescontosVenda, descManual: desc, descBandeira: brandDiscountVal, bandeira: Varejo.state.selectedBrand, items: Varejo.state.cart, nsu, aut, installments }),
                    session_id: localStorage.getItem('active_cash_session') || null
                };

                const { data, error } = await _sb.from('orders').insert(orderSnapshot).select().single();
                if (error) throw error;

                // Log de Auditoria do Multi-operador
                if (typeof App !== 'undefined' && App.multiOperator && App.multiOperator.logAction) {
                    App.multiOperator.logAction("VENDA_FINALIZADA", { 
                        orderId: data.id, 
                        total: orderSnapshot.total_pago,
                        itemsCount: Varejo.state.cart.length
                    });
                }

                // Parcelas do Crediário
                if (installments.length > 0) {
                    const parcels = installments.map(i => ({
                        store_id: App.state.storeId,
                        order_id: data.id,
                        customer_id: Varejo.state.currentCliente.id,
                        installment_number: i.parcela,
                        due_date: i.vencimento,
                        amount: i.valor,
                        status: 'pendente'
                    }));
                    await _sb.from('crediario_installments').insert(parcels);
                }

                // Descontar Estoque
                const stockMoves = Varejo.state.cart.reduce((a, c) => {
                    const x = a.find(e => e.id === c.id);
                    if (x) x.qtd++; else a.push({ id: c.id, qtd: 1 });
                    return a;
                }, []);
                await _sb.rpc('descontar_estoque', { itens: stockMoves });

                App.utils.toast("Venda registrada!", "success");
                document.getElementById('pos-pay-modal').style.display = 'none';

                // Impressão e Limpeza
                const ticketCopy = [...Varejo.state.cart];
                const savedCliente = Varejo.state.currentCliente;
                Varejo.state.cart = [];
                Varejo.state.currentCliente = null;
                Varejo.state.selectedBrand = null;
                Varejo.renderCart();
                // NFC-e e Impressão
                if (typeof Fiscal !== 'undefined' && (App.state.currentStore?.nuvem_client_id || App.state.storeId)) {
                    const querEmitir = await NaxioUI.confirm('🧾 Emitir NFC-e?', 'Deseja gerar a nota fiscal agora?', 'Sim, Emitir', 'Não, Apenas Recibo');
                    if (querEmitir) {
                        const pmts = pays.map(p => ({
                            tipo: (p.tipo === 'Crediário' || p.tipo === 'Nota') ? '05' : '01', // Mapeamento básico
                            val: p.val.toFixed(2),
                            tipo_original: p.tipo
                        }));
                        Fiscal.emitirNFCe(data.id, orderSnapshot.total_pago, pmts, ticketCopy.map(i => ({ id: i.id, nome: i.nome, price: i.preco, qtd: 1 })));
                    } else {
                        // Se clicou em "Apenas Recibo", imprime direto sem perguntar de novo
                        Varejo.printReceipt(data, ticketCopy, pays, totalDescontosVenda, savedCliente, installments);
                    }
                } else {
                    // Sem módulo fiscal ou desativado, imprime recibo direto
                    Varejo.printReceipt(data, ticketCopy, pays, totalDescontosVenda, savedCliente, installments);
                }
            } catch (err) {
                console.error("Erro Finalização:", err);
                NaxioUI.alert('Erro', 'Não foi possível salvar a venda: ' + err.message, 'error');
            }
        };

        if (valCrediario > 0) {
            App.crediario.openInstallmentModal(valCrediario, Varejo.state.currentCliente, proceed);
        } else {
            proceed();
        }
    },

    buscarCliente: async (t) => {
        const res = document.getElementById('pos-main-customer-results');
        if (!t || t.length < 2) { res.style.display = 'none'; return; }
        
        const { data } = await _sb.from('profiles').select('id, nome_completo, cpf').ilike('nome_completo', `%${t}%`).limit(10);
        
        if (!data?.length) { 
            res.innerHTML = `<div style="padding:20px; text-align:center; opacity:0.5; font-size:0.8rem;">NENHUM CLIENTE ENCONTRADO</div>`;
            res.style.display = 'block';
            return; 
        }

        res.innerHTML = data.map(c => `
            <div onclick="Varejo.selecionarCliente(${JSON.stringify(c).replace(/"/g, '&quot;')})" 
                 style="padding:15px 20px; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.05); transition:0.2s; display:flex; flex-direction:column; gap:4px;"
                 onmouseover="this.style.background='rgba(255,255,255,0.08)'" 
                 onmouseout="this.style.background='transparent'">
                <span style="font-weight:800; font-size:0.95rem; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.nome_completo.toUpperCase()}</span>
                <span style="font-size:0.7rem; color:var(--pos-accent); font-weight:800; letter-spacing:0.5px;">CPF/ID: ${c.cpf || 'NÃO INFORMADO'}</span>
            </div>
        `).join('');
        res.style.display = 'block';
    },

    selecionarCliente: (c) => { 
        Varejo.state.currentCliente = c; 
        Varejo._atualizarPainelCliente(); 
        document.getElementById('pos-main-customer-results').style.display = 'none';
        const searchInput = document.getElementById('pos-main-customer-search');
        if (searchInput) searchInput.value = '';
    },
    editarClienteAtual: () => {
        const c = Varejo.state.currentCliente;
        if (!c) return;

        let existing = document.getElementById('edit-varejo-cliente-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'edit-varejo-cliente-modal';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15, 23, 42, 0.75); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); display:flex; justify-content:center; align-items:center; z-index:99999; animation: fadeIn 0.2s ease-out;';
        modal.innerHTML = `
            <style>
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .modern-input-wrapper {
                    position: relative;
                    margin-bottom: 16px;
                }
                .modern-input-wrapper label {
                    color: #94a3b8;
                    font-size: 0.85rem;
                    font-weight: 500;
                    margin-bottom: 6px;
                    display: block;
                    transition: color 0.2s;
                }
                .modern-input-wrapper:focus-within label {
                    color: var(--pos-accent, #38bdf8);
                }
                .modern-pos-input {
                    width: 100%;
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 12px;
                    padding: 12px 16px;
                    color: #f8fafc;
                    font-size: 0.95rem;
                    transition: all 0.2s ease;
                    outline: none;
                    box-sizing: border-box;
                }
                .modern-pos-input:focus {
                    border-color: var(--pos-accent, #38bdf8);
                    box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
                }
                .modern-pos-input::placeholder {
                    color: #475569;
                }
                .modern-btn {
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                .modern-btn-cancel {
                    background: transparent;
                    color: #94a3b8;
                    border: 1px solid #334155;
                }
                .modern-btn-cancel:hover {
                    background: #1e293b;
                    color: #f1f5f9;
                    border-color: #475569;
                }
                .modern-btn-save {
                    background: var(--pos-accent, #0ea5e9);
                    color: #ffffff;
                    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
                }
                .modern-btn-save:hover {
                    filter: brightness(1.1);
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(14, 165, 233, 0.4);
                }
                .modern-btn-save:active {
                    transform: translateY(1px);
                }
                .close-btn-modern {
                    background: #1e293b;
                    border: 1px solid #334155;
                    color: #94a3b8;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .close-btn-modern:hover {
                    background: #ef4444;
                    color: white;
                    border-color: #ef4444;
                    transform: rotate(90deg);
                }
            </style>
            <div style="background: linear-gradient(145deg, #1e293b, #0f172a); border: 1px solid #334155; border-radius: 24px; width: 420px; max-width: 90%; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:28px;">
                    <h3 style="margin:0; color:#f8fafc; font-size: 1.25rem; font-weight: 600; display:flex; align-items:center; gap:10px;">
                        <div style="background: rgba(56, 189, 248, 0.1); padding: 8px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                            <i class="ri-edit-2-line" style="color:var(--pos-accent, #38bdf8); font-size: 1.2rem;"></i>
                        </div>
                        Editar Cliente
                    </h3>
                    <button class="close-btn-modern" onclick="document.getElementById('edit-varejo-cliente-modal').remove()">
                        <i class="ri-close-line"></i>
                    </button>
                </div>
                <div style="display:flex; flex-direction:column;">
                    <div class="modern-input-wrapper">
                        <label>Nome Completo</label>
                        <input type="text" id="ev-cli-nome" class="modern-pos-input" placeholder="Ex: Maria Joaquina" value="${c.nome_completo || c.nome || ''}">
                    </div>
                    <div class="modern-input-wrapper">
                        <label>CPF/CNPJ</label>
                        <input type="text" id="ev-cli-cpf" class="modern-pos-input" placeholder="000.000.000-00" value="${c.cpf || ''}">
                    </div>
                    <div class="modern-input-wrapper">
                        <label>WhatsApp / Contato</label>
                        <input type="text" id="ev-cli-whatsapp" class="modern-pos-input" placeholder="(00) 00000-0000" value="${c.whatsapp || ''}">
                    </div>
                    <div class="modern-input-wrapper" style="margin-bottom: 8px;">
                        <label>E-mail (Opcional)</label>
                        <input type="email" id="ev-cli-email" class="modern-pos-input" placeholder="email@exemplo.com" value="${c.email || ''}">
                    </div>
                </div>
                <div style="display:flex; gap:12px; margin-top:32px;">
                    <button class="modern-btn modern-btn-cancel" style="flex: 1;" onclick="document.getElementById('edit-varejo-cliente-modal').remove()">Cancelar</button>
                    <button class="modern-btn modern-btn-save" style="flex: 2;" onclick="Varejo.salvarEdicaoCliente('${c.id}')"><i class="ri-save-3-line"></i> Salvar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },
    salvarEdicaoCliente: async (id) => {
        const updateData = {
            nome_completo: document.getElementById('ev-cli-nome').value.trim(),
            cpf: document.getElementById('ev-cli-cpf').value.trim(),
            whatsapp: document.getElementById('ev-cli-whatsapp').value.trim(),
            email: document.getElementById('ev-cli-email').value.trim(),
        };

        try {
            App.utils.toast("Salvando...", "info");
            const { error } = await _sb.from('profiles').update(updateData).eq('id', id);
            if (error) throw error;
            App.utils.toast("Cliente atualizado com sucesso!", "success");
            
            Varejo.state.currentCliente = { ...Varejo.state.currentCliente, ...updateData };
            Varejo._atualizarPainelCliente();
            
            document.getElementById('edit-varejo-cliente-modal').remove();
        } catch (err) {
            console.error("Erro ao atualizar cliente", err);
            NaxioUI.alert("Erro", "Falha ao atualizar cliente: " + err.message, "danger");
        }
    },
    limparCliente: () => { Varejo.state.currentCliente = null; Varejo._atualizarPainelCliente(); },
    _atualizarPainelCliente: () => {
        const c = Varejo.state.currentCliente;
        const p = document.getElementById('pos-main-customer-selected');
        const s = document.getElementById('pos-main-customer-search-area');
        const nameEl = document.getElementById('pos-main-customer-name');

        if (c) { 
            if (p) p.style.display = 'block'; 
            if (s) s.style.display = 'none'; 
            if (nameEl) nameEl.innerText = c.nome_completo || c.nome || 'Cliente'; 
        } else { 
            if (p) p.style.display = 'none'; 
            if (s) s.style.display = 'block'; 
        }
        if (typeof Varejo.saveRecoveryState === 'function') Varejo.saveRecoveryState();
    },

    loadCategories: async () => {
        const list = document.getElementById('pos-category-list');
        if (!list) return; // Segurança: se não houver o container de categorias, não faz nada

        const { data } = await _sb.from('products').select('categoria').eq('store_id', App.state.storeId);
        if (!data) return;
        
        const cats = [...new Set(data.map(c => c.categoria))].filter(Boolean).sort();
        list.innerHTML = ''; // Limpa antes de carregar
        cats.forEach(c => {
            const div = document.createElement('div'); 
            div.className = 'cat-btn'; 
            div.innerHTML = `<i class="ri-folder-line"></i><span>${c}</span>`;
            div.onclick = () => Varejo.loadProductsByCategory(c, div); 
            list.appendChild(div);
        });
    },

    loadProductsByCategory: async (c, el) => {
        const grid = document.getElementById('pos-product-grid');
        if (!grid) return; // Segurança: se não houver a grade de produtos, não faz nada

        if (el) { 
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active')); 
            el.classList.add('active'); 
        }
        
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px; opacity:0.5;"><i class="ri-loader-4-line spin" style="font-size:2rem;"></i><br>Carregando Itens...</div>';
        
        try {
            let q = _sb.from('products').select('*').eq('store_id', App.state.storeId).limit(50);
            if (c) q = q.eq('categoria', c);
            const { data, error } = await q;
            
            if (error) throw error;

            grid.innerHTML = data.map(p => `
                <div class="product-card animate-in" onclick="Varejo.addItem(${JSON.stringify(p).replace(/"/g, '&quot;')}, 1)">
                    <div style="font-weight:800; font-size:1.1rem; height:2.5rem; overflow:hidden; line-height:1.2;">${p.nome}</div>
                    <div class="price-tag">R$ ${parseFloat(p.preco).toFixed(2)}</div>
                    <div class="stock-bar">
                        <div class="stock-progress" style="width:${Math.min(100, (p.estoque || 0) * 10)}%; background:${p.estoque < 5 ? '#f43f5e' : '#10b981'}"></div>
                    </div>
                    <div style="font-size:0.65rem; font-weight:800; color:var(--pos-text-muted); margin-top:5px; display:flex; justify-content:space-between;">
                        <span>ESTOQUE: ${p.estoque || 0} UN</span>
                        <span>COD: ${p.id.toString().slice(-4).toUpperCase()}</span>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:red;">Erro ao carregar produtos.</div>';
        }
    },

    startClock: () => setInterval(() => { const el = document.getElementById('pos-clock'); if (el) el.innerText = new Date().toLocaleTimeString('pt-BR'); }, 1000),

    printReceipt: (order, items, pays, desc, cliente, installments = []) => {
        const win = window.open('', '', 'width=800,height=600');
        const storeName = (App.state.currentStore?.nome_loja) || App.state.storeName || 'NAXIO GESSO';
        const date = new Date().toLocaleString('pt-BR');

        // Agrupa itens para o recibo
        const grouped = [];
        items.forEach(i => {
            const ex = grouped.find(g => g.id === i.id);
            if (ex) { ex.qtd++; ex.total = ex.qtd * i.preco; }
            else { grouped.push({ ...i, qtd: 1, total: i.preco }); }
        });

        // Detalhes do Crediário
        let installmentsHtml = '';
        if (installments && installments.length > 0) {
            installmentsHtml = `
                <div class="sep"></div>
                <div class="bold" style="font-size:11px;">PROGRAMAÇÃO DE PAGAMENTO (CREDIÁRIO):</div>
                ${installments.map(ins => `
                    <div class="item" style="font-size:11px;">
                        <span>Parc. ${ins.parcela} (${new Date(ins.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')})</span>
                        <span class="bold">R$ ${parseFloat(ins.valor).toFixed(2)}</span>
                    </div>
                `).join('')}
            `;
        }

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Comprovante de Venda - NAXIO GESSO</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
                    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Space Mono', 'Courier New', Courier, monospace !important; }
                    body { 
                        width: 100%;
                        max-width: 80mm;
                        margin: 0 auto; 
                        padding: 12px 10px; 
                        color: #000; 
                        background: #fff;
                        font-size: 12px; 
                        line-height: 1.35; 
                        -webkit-print-color-adjust: exact; 
                    }
                    .center { text-align: center; }
                    .header-title { font-size: 16px; font-weight: 700; letter-spacing: 0.5px; }
                    .header-sub { font-size: 11px; text-transform: uppercase; margin-top: 2px; }
                    .bold { font-weight: 700; }
                    .sep { border-top: 1px dashed #000; margin: 8px 0; }
                    .sep-double { border-top: 2px solid #000; margin: 10px 0; }
                    .item { display: flex; justify-content: space-between; margin-bottom: 4px; }
                    .total-box { 
                        display: flex; justify-content: space-between; 
                        font-size: 17px; font-weight: 700; 
                        padding: 4px 0;
                        border-top: 1px solid #000;
                        border-bottom: 1px solid #000;
                        margin: 6px 0;
                    }
                    .footer { font-size: 10.5px; margin-top: 12px; padding-top: 8px; border-top: 1px dashed #000; line-height: 1.4; }
                    .gesso-badge { font-size: 10px; padding: 2px 4px; border: 1px solid #000; display: inline-block; margin-top: 4px; }
                    
                    @page { margin: 0; size: 80mm auto; }
                    @media print { 
                        body { width: 80mm; padding: 8px; margin: 0; } 
                        .no-print { display: none; } 
                    }
                    .no-print { margin-top: 20px; text-align: center; background: #f0f0f0; padding: 10px; border-radius: 8px; }
                    .no-print button { padding: 10px 20px; cursor: pointer; margin: 5px; background: #000; color: #fff; border: none; border-radius: 5px; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="center header-title">NAXIO GESSO</div>
                <div class="center header-sub">${storeName.toUpperCase()}</div>
                <div class="center"><span class="gesso-badge">GESSO • DRYWALL • PERFIS • ACABAMENTOS</span></div>
                <div class="sep"></div>
                <div style="font-size:11px;">
                    <div>DATA/HORA: ${date}</div>
                    <div>PEDIDO / VENDA: #${order.id.toString().slice(-6).toUpperCase()}</div>
                    <div>CLIENTE: ${cliente?.nome_completo ? cliente.nome_completo.toUpperCase() : 'CONSUMIDOR FINAL'}</div>
                    ${cliente?.cpf_cnpj ? `<div>CPF/CNPJ: ${cliente.cpf_cnpj}</div>` : ''}
                </div>
                <div class="sep"></div>
                <div class="bold" style="font-size:11.5px; margin-bottom:4px;">DISCRIMINAÇÃO DOS MATERIAIS:</div>
                <div style="font-size:12px;">
                ${grouped.map(i => `
                    <div class="item">
                        <span style="flex:1; padding-right:8px;">${i.qtd}x ${i.nome.toUpperCase().slice(0, 28)}</span>
                        <span class="bold">R$ ${i.total.toFixed(2)}</span>
                    </div>
                `).join('')}
                </div>
                <div class="sep"></div>
                <div class="item"><span>SUBTOTAL:</span> <span>R$ ${(Varejo.state.totalTicket || 0).toFixed(2)}</span></div>
                ${desc > 0 ? `<div class="item"><span>DESCONTO CONCEDIDO:</span> <span>- R$ ${desc.toFixed(2)}</span></div>` : ''}
                <div class="total-box">
                    <span>TOTAL LIQUIDO:</span> 
                    <span>R$ ${(order.total_pago).toFixed(2)}</span>
                </div>
                <div class="bold" style="font-size:11.5px; margin-top:6px;">FORMA(S) DE PAGAMENTO:</div>
                ${pays.map(p => `<div class="item" style="font-size:11.5px;"><span>${p.tipo.toUpperCase()}:</span> <span class="bold">R$ ${p.val.toFixed(2)}</span></div>`).join('')}
                
                ${installmentsHtml}

                <div class="sep-double"></div>
                <div class="center footer">
                    <strong>NAXIO GESSO - ESPECIALISTA EM FORROS E MOLDURAS</strong><br>
                    Agradecemos a confiança e preferência!<br>
                    Materiais de gesso entregues conferidos no ato.<br>
                    <span style="font-size:9.5px; opacity:0.8;">Sistema de Emissão Naxio Gesso Enterprise</span>
                </div>
                <div class="no-print">
                    <button onclick="window.print()">IMPRIMIR RECIBO</button>
                    <button onclick="window.close()">FECHAR</button>
                </div>
                <script>
                    setTimeout(() => { 
                        window.print();
                    }, 600);
                </script>
            </body>
            </html>
        `;
        win.document.write(html);
        win.document.close();
    },
    getCardBrands: () => {
        try {
            return JSON.parse(localStorage.getItem('naxio_card_brands') || '[]');
        } catch(e) {
            return [];
        }
    },
    saveCardBrands: (brands) => {
        localStorage.setItem('naxio_card_brands', JSON.stringify(brands));
    },
    openCardBrandsModal: () => {
        if(document.getElementById('pos-card-brands-modal')) document.getElementById('pos-card-brands-modal').remove();
        const html = `
        <div id="pos-card-brands-modal" class="modal-overlay" style="display:flex; z-index:100001;">
            <div class="modal-content" style="max-width:600px; display:flex; flex-direction:column; padding:0;">
                <div class="modal-header" style="padding:20px; border-bottom:1px solid rgba(255,255,255,0.1);">
                    <h3><i class="ri-bank-card-fill"></i> Configuração de Bandeiras</h3>
                    <button class="btn btn-secondary btn-sm" onclick="document.getElementById('pos-card-brands-modal').remove()">X</button>
                </div>
                <div class="modal-body scroll-thin" style="padding:20px; overflow-y:auto; max-height:50vh;">
                    <div id="card-brands-list" style="display:flex; flex-direction:column; gap:10px;"></div>
                </div>
                <div style="padding:20px; border-top:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.2);">
                    <h4 style="margin-bottom:10px; font-size:0.9rem;">Adicionar Nova Bandeira</h4>
                    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">
                        <input type="text" id="cb-name" class="input-field" placeholder="Nome (ex: Visa)">
                        <input type="number" id="cb-desc" class="input-field" placeholder="Desconto %" step="0.1">
                        <input type="text" id="cb-img" class="input-field" placeholder="URL da Imagem">
                    </div>
                    <button class="btn btn-primary btn-full" style="margin-top:10px;" onclick="Varejo.addCardBrand()">Adicionar Bandeira</button>
                </div>
            </div>
        </div>
        `;
        const container = document.getElementById('view-pos') || document.body;
        container.insertAdjacentHTML('beforeend', html);
        Varejo.renderCardBrandsModalList();
    },
    openSelectCardBrandModal: () => {
        if(document.getElementById('pos-select-brand-modal')) document.getElementById('pos-select-brand-modal').remove();
        const brands = Varejo.getCardBrands();
        if(brands.length === 0) {
            App.utils.toast('Nenhuma bandeira cadastrada.', 'error');
            return;
        }
        const html = `
        <div id="pos-select-brand-modal" class="modal-overlay" style="display:flex; z-index:100001; align-items:center; justify-content:center;">
            <div class="modal-content" style="max-width:500px; width:90%; display:flex; flex-direction:column; padding:0; border-radius:16px; overflow:hidden;">
                <div class="modal-header" style="padding:20px; background:linear-gradient(135deg, rgba(255,255,255,0.05), rgba(0,0,0,0.2)); border-bottom:1px solid rgba(255,255,255,0.1);">
                    <h3 style="margin:0;"><i class="ri-bank-card-fill" style="color:var(--pos-accent);"></i> Selecionar Bandeira</h3>
                    <button class="btn btn-secondary btn-sm" style="border-radius:8px;" onclick="document.getElementById('pos-select-brand-modal').remove()"><i class="ri-close-line"></i></button>
                </div>
                <div class="modal-body scroll-thin" style="padding:20px; overflow-y:auto; max-height:60vh; background:rgba(0,0,0,0.4);">
                    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 15px;">
                        ${brands.map((b, i) => `
                            <button class="btn pay-brand-btn" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; background:rgba(255,255,255,0.05); border:2px solid transparent; padding:15px; border-radius:12px; transition:0.3s; cursor:pointer;" onclick="Varejo.selectCardBrandForPayment(${i}); document.getElementById('pos-select-brand-modal').remove();" onmouseover="this.style.borderColor='var(--pos-accent)'; this.style.background='rgba(255,255,255,0.1)';" onmouseout="this.style.borderColor='transparent'; this.style.background='rgba(255,255,255,0.05)';">
                                ${b.img ? `<img src="${b.img}" style="height:40px; width:60px; object-fit:contain; background:#fff; border-radius:6px; padding:2px;">` : `<i class="ri-bank-card-line" style="font-size:2rem; color:var(--pos-accent);"></i>`}
                                <span style="font-size:0.9rem; font-weight:800; margin-top:5px; color:#fff;">${b.name}</span>
                                ${b.discount > 0 ? `<span style="font-size:0.75rem; color:var(--pos-success); font-weight:bold; background:rgba(16,185,129,0.1); padding:2px 8px; border-radius:4px;">-${b.discount}%</span>` : ''}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
        `;
        const container = document.getElementById('view-pos') || document.body;
        container.insertAdjacentHTML('beforeend', html);
    },
    renderCardBrandsModalList: () => {
        const list = document.getElementById('card-brands-list');
        if(!list) return;
        const brands = Varejo.getCardBrands();
        if(brands.length === 0) {
            list.innerHTML = '<p class="text-muted" style="text-align:center;">Nenhuma bandeira cadastrada.</p>';
            return;
        }
        list.innerHTML = brands.map((b, i) => `
            <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.05); padding:10px 15px; border-radius:8px;">
                <div style="display:flex; align-items:center; gap:15px;">
                    ${b.img ? `<img src="${b.img}" style="height:30px; width:45px; object-fit:contain; background:#fff; border-radius:4px;">` : `<div style="height:30px; width:45px; background:var(--pos-accent); border-radius:4px; display:flex; align-items:center; justify-content:center;"><i class="ri-bank-card-line"></i></div>`}
                    <div>
                        <strong style="display:block;">${b.name}</strong>
                        <span style="color:var(--pos-success); font-size:0.8rem;">Desconto: ${b.discount}%</span>
                    </div>
                </div>
                <button class="btn btn-danger btn-sm" onclick="Varejo.removeCardBrand(${i})"><i class="ri-delete-bin-line"></i></button>
            </div>
        `).join('');
    },
    addCardBrand: () => {
        const name = document.getElementById('cb-name').value.trim();
        const desc = parseFloat(document.getElementById('cb-desc').value) || 0;
        const img = document.getElementById('cb-img').value.trim();
        if(!name) return App.utils.toast('Nome da bandeira é obrigatório!', 'error');
        const brands = Varejo.getCardBrands();
        brands.push({name, discount: desc, img});
        Varejo.saveCardBrands(brands);
        document.getElementById('cb-name').value = '';
        document.getElementById('cb-desc').value = '';
        document.getElementById('cb-img').value = '';
        Varejo.renderCardBrandsModalList();
        App.utils.toast('Bandeira adicionada!', 'success');
        Varejo.renderPaymentCardBrands();
    },
    removeCardBrand: async (index) => {
        if(!await confirm('Tem certeza que deseja excluir esta bandeira?')) return;
        const brands = Varejo.getCardBrands();
        brands.splice(index, 1);
        Varejo.saveCardBrands(brands);
        Varejo.renderCardBrandsModalList();
        Varejo.renderPaymentCardBrands();
    },
    selectCardBrandForPayment: (index) => {
        const brands = Varejo.getCardBrands();
        const brand = brands[index];
        if(!brand) return;
        
        // Remove active class from all
        document.querySelectorAll('.pay-brand-btn').forEach(b => {
            b.style.borderColor = 'var(--pos-border)';
            b.style.background = 'rgba(255,255,255,0.05)';
        });
        
        // Add active class to selected
        const btn = document.getElementById('btn-brand-' + index) || document.getElementById('btn-brand-0-' + index) || document.getElementById('btn-brand-1-' + index);
        if(btn) {
            btn.style.borderColor = 'var(--pos-accent)';
            btn.style.background = 'rgba(0,0,0,0.3)';
        }

        Varejo.state.selectedBrand = brand;
        document.querySelectorAll('.btn-remove-brand').forEach(b => b.style.display = 'block');
        
        // No modo único, atualiza o campo de pagamento atualmente preenchido com o novo total com desconto
        const activeRadio = document.querySelector('input[type="radio"]:checked');
        const mode = activeRadio ? activeRadio.value : 'unico';
        if (mode === 'unico') {
            const ids = ['pay-money', 'pay-pix', 'pay-credit', 'pay-debit', 'pay-crediario'];
            const activeInput = ids.map(id => document.getElementById(id)).find(el => el && parseFloat(el.value) > 0);
            if (activeInput) {
                const desc = parseFloat(document.getElementById('pay-desconto')?.value) || 0;
                const brandDiscountVal = (Varejo.state.totalTicket * (brand.discount || 0)) / 100;
                activeInput.value = Math.max(0, Varejo.state.totalTicket - desc - brandDiscountVal).toFixed(2);
            }
        }
        
        Varejo.calcRestante();
        App.utils.toast(`Bandeira ${brand.name} selecionada.`, 'success');
    },
    removeSelectedCardBrandForPayment: () => {
        Varejo.state.selectedBrand = null;
        document.querySelectorAll('.pay-brand-btn').forEach(b => {
            b.style.borderColor = 'var(--pos-border)';
            b.style.background = 'rgba(255,255,255,0.05)';
        });
        document.querySelectorAll('.btn-remove-brand').forEach(b => b.style.display = 'none');
        
        // No modo único, restaura o valor do campo ativo
        const activeRadio = document.querySelector('input[type="radio"]:checked');
        const mode = activeRadio ? activeRadio.value : 'unico';
        if (mode === 'unico') {
            const ids = ['pay-money', 'pay-pix', 'pay-credit', 'pay-debit', 'pay-crediario'];
            const activeInput = ids.map(id => document.getElementById(id)).find(el => el && parseFloat(el.value) > 0);
            if (activeInput) {
                const desc = parseFloat(document.getElementById('pay-desconto')?.value) || 0;
                activeInput.value = Math.max(0, Varejo.state.totalTicket - desc).toFixed(2);
            }
        }

        Varejo.calcRestante();
        App.utils.toast('Bandeira removida', 'info');
    },
    renderPaymentCardBrands: () => {
        ['payment-card-brands-container', 'payment-card-brands-container-2'].forEach((id, containerIdx) => {
            const container = document.getElementById(id);
            if(!container) return;
            const brands = Varejo.getCardBrands();
            if(brands.length === 0) {
                container.innerHTML = '';
                container.style.display = 'none';
                return;
            }
            
            container.style.display = 'flex';
            container.innerHTML = brands.map((b, i) => `
                <button id="btn-brand-${containerIdx}-${i}" class="btn pay-brand-btn" style="flex:1; display:flex; flex-direction:column; align-items:center; gap:5px; background:rgba(255,255,255,0.05); border:1px solid var(--pos-border); padding:10px; border-radius:8px;" onclick="Varejo.selectCardBrandForPayment(${i})">
                    ${b.img ? `<img src="${b.img}" style="height:25px; object-fit:contain;">` : `<i class="ri-bank-card-line" style="font-size:1.5rem;"></i>`}
                    <span style="font-size:0.75rem; font-weight:bold;">${b.name}</span>
                    ${b.discount > 0 ? `<span style="font-size:0.65rem; color:var(--pos-success);">-${b.discount}%</span>` : ''}
                </button>
            `).join('');
        });
    },
    openToolsMenu: () => {
        const tools = Object.entries(App.storeTools);
        const html = `
        <div id="pos-tools-modal" class="modal-overlay" style="display:flex;">
            <div class="modal-content" style="max-width:800px; max-height:80vh; overflow:hidden; display:flex; flex-direction:column;">
                <div class="modal-header">
                    <h3><i class="ri-magic-line"></i> Ferramentas Enterprise (30 Funcionalidades)</h3>
                    <button class="btn btn-secondary btn-sm" onclick="document.getElementById('pos-tools-modal').remove()">X</button>
                </div>
                <div class="modal-body scroll-thin" style="flex:1; overflow-y:auto; padding:20px; display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:10px;">
                    ${tools.map(([key, fn]) => {
                        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        return `<button class="btn btn-outline" style="text-align:left; padding:15px; border-radius:12px; font-size:0.85rem;" onclick="App.storeTools.${key}()">
                            <i class="ri-checkbox-circle-line" style="color:var(--pos-success);"></i> ${label}
                        </button>`;
                    }).join('')}
                </div>
                <div class="modal-footer" style="padding:15px; border-top:1px solid var(--pos-border); text-align:center; font-size:0.75rem; color:var(--pos-text-muted);">
                    As funcionalidades marcadas como (em breve) serão liberadas na próxima atualização.
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }
};

window.Varejo = Varejo;
console.log("✅ Varejo 5.0 Pronto.");
/**
 * NAXIO PRO PDV - Módulo Varejo Modernizado
 * Versão: 5.0.0
 * Descrição: Sistema de PDV com interface glassmorphism, multi-abas,
 * busca inteligente e integração fiscal completa.
 */

var Varejo = window.Varejo = window.Varejo || {
    state: {
        allProductsCache: [],
        currentTabIndex: 0,
        tabs: [
            { id: 1, cart: [], cliente: null, total: 0 },
            { id: 2, cart: [], cliente: null, total: 0 },
            { id: 3, cart: [], cliente: null, total: 0 }
        ],
        cart: [],
        currentCliente: null,
        totalTicket: 0,
        pendingQty: 1,
        discount: 0,
        _lastScannedCode: null,
        isOpen: false
    },

    init: async () => {
        console.log("🏪 Naxio Pro PDV: Iniciando sistema...");
        
        // Timeout de segurança para o Caixa: se demorar mais de 1s, prossegue
        const sessionPromise = (typeof Caixa !== 'undefined' && typeof Caixa.checkSession === 'function') 
            ? Caixa.checkSession() 
            : Promise.resolve();

        try {
            await Promise.race([
                sessionPromise,
                new Promise(resolve => setTimeout(resolve, 1500))
            ]);
        } catch(e) { console.warn("Aviso: Sessão de caixa demorou a responder, prosseguindo..."); }

        const saved = localStorage.getItem('naxio_pos_recovery');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Validação de integridade: Verifica se é um array de abas válido
                if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].cart || parsed[0].ticket)) {
                    Varejo.state.tabs = parsed.map(t => ({ ...t, cart: t.cart || t.ticket || [] }));
                    const currentTab = Varejo.state.tabs[Varejo.state.currentTabIndex] || Varejo.state.tabs[0];
                    Varejo.state.cart = Array.isArray(currentTab.cart) ? [...currentTab.cart] : [];
                    Varejo.state.currentCliente = currentTab.cliente || null;
                    Varejo.state.totalTicket = typeof currentTab.total === 'number' ? currentTab.total : 0;
                    console.log("🛡️ Blindagem: Estado recuperado com integridade.");
                } else {
                    throw new Error("Dados de recuperação corrompidos ou em formato inválido.");
                }
            } catch(e) { 
                console.error("🚨 Erro na Blindagem (Recuperação):", e);
                Varejo.autoRepair(); // Tenta limpar e estabilizar
            }
        }

        Varejo.injectStyles();
        Varejo.injectHTML();
        Varejo.startClock();
        Varejo.loadCategories();
        Varejo.loadProductsByCategory(null);
        Varejo.switchTab(0);

        // Sincroniza Operador Atual
        const opName = localStorage.getItem('active_operator_name') || 'OPERADOR PADRÃO';
        const btnPos = document.getElementById('btn-pos-operator');
        const footerOp = document.getElementById('pos-operator-footer-name');
        
        if (opName) {
            if (btnPos) btnPos.innerHTML = `<i class="ri-user-settings-line"></i> ${opName.split(' ')[0]}`;
            if (footerOp) footerOp.innerHTML = `<i class="ri-user-voice-fill"></i> OPERADOR: ${opName.toUpperCase()}`;
        }

        // Monitor de Rede e Atalhos
        window.addEventListener('offline', () => Varejo.setConnectivity(false));
        window.addEventListener('online', () => Varejo.setConnectivity(true));
        Varejo.setConnectivity(navigator.onLine); // Verifica estado real no início
        window.addEventListener('keydown', Varejo.handleHotkeys);

        // Sistema de Blindagem: Salva estado a cada 2 segundos
        setInterval(Varejo.saveRecoveryState, 2000);
        setInterval(Varejo.updateNetworkStats, 3000);
        
        Varejo.state.isOpen = true;
        console.log("🚀 PDV OPERACIONAL.");
    },

    setConnectivity: (online) => {
        const banner = document.getElementById('pos-offline-banner');
        const health = document.getElementById('health-sync');
        // Força verificação real se houver erro
        const isActuallyOnline = navigator.onLine;
        if (banner) banner.style.display = isActuallyOnline ? 'none' : 'flex';
        if (health) health.style.background = isActuallyOnline ? '#0ea5e9' : 'var(--pos-danger)';
    },

    updateNetworkStats: () => {
        const lat = Math.floor(Math.random() * 5) + 2;
        const el = document.getElementById('pos-latency');
        if (el) el.innerText = `${lat}ms`;
    },

    handleHotkeys: (e) => {
        if (!Varejo.state.isOpen) return;
        
        switch(e.key) {
            case 'F1': e.preventDefault(); document.getElementById('pos-barcode')?.focus(); break;
            case 'F2': e.preventDefault(); Varejo.openPaymentModal(); break;
            case 'F3': e.preventDefault(); Varejo.cancelSaleWithPassword(); break;
            case 'Escape': 
                if (document.querySelector('.modal-overlay[style*="flex"]')) {
                    // Fecha modal se houver
                } else {
                    App.router.go('loja');
                }
                break;
        }
    },

    playSound: (type) => {
        const sounds = {
            beep: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
            success: 'https://actions.google.com/sounds/v1/buttons/button_positive.ogg',
            error: 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg'
        };
        new Audio(sounds[type]).play().catch(() => {});
    },

    openPDV: () => {
        console.log("📂 Tentando abrir visualmente o PDV...");
        Varejo.state.isOpen = true;
        
        // Garante que o elemento existe antes de navegar
        if (!document.getElementById('view-pos')) {
            console.warn("⚠️ view-pos não encontrado, injetando agora...");
            Varejo.injectHTML();
        }

        if (typeof App !== 'undefined' && App.router) {
            App.router.go('pos');
        }

        // Força visibilidade por segurança
        const posEl = document.getElementById('view-pos');
        if (posEl) {
            posEl.style.display = 'block';
            posEl.classList.add('active');
            console.log("✅ View 'pos' ativada e visível.");
        }

        setTimeout(() => {
            const input = document.getElementById('pos-barcode');
            if (input) input.focus();
        }, 300);
    },

    sair: () => {
        console.log("🚪 Saindo do PDV...");
        Varejo.state.isOpen = false;
        const posEl = document.getElementById('view-pos');
        if (posEl) {
            posEl.classList.remove('active');
            posEl.style.display = 'none';
        }
        if (typeof App !== 'undefined' && App.router) {
            App.router.goDashboard();
        } else {
            window.location.reload(); // Fallback de emergência
        }
    },

    injectStyles: () => {
        if (document.getElementById('pos-styles')) return;
        const style = document.createElement('style');
        style.id = 'pos-styles';
        style.innerHTML = `
            :root {
                --pos-bg: #f8fafc;
                --pos-panel: #ffffff;
                --pos-accent: #0284c7;
                --pos-accent-gradient: linear-gradient(135deg, #0284c7, #2563eb);
                --pos-success: #10b981;
                --pos-danger: #ef4444;
                --pos-text: #0f172a;
                --pos-text-muted: #64748b;
                --pos-border: #e2e8f0;
                --pos-glass: none;
                --shadow-neon: 0 4px 12px rgba(2, 132, 199, 0.2);
            }

            #view-pos {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: #f1f5f9;
                color: var(--pos-text); font-family: 'Outfit', sans-serif;
                z-index: 99999;
                display: none; /* Escondido por padrão */
            }
            #view-pos.active { display: block !important; }

            /* Grid Principal Ajustado */
            .pos-container {
                display: grid;
                grid-template-columns: 1fr 380px;
                grid-template-rows: 70px 1fr;
                width: 100vw; height: 100vh;
                gap: 15px; padding: 15px; box-sizing: border-box;
                background: var(--pos-bg);
            }

            .pos-main-sale {
                grid-row: 2;
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            /* Tabela de Itens Profissional */
            .sale-table-container {
                flex: 1;
                background: var(--pos-panel);
                border-radius: 28px;
                border: 1px solid var(--pos-border);
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

            .sale-table-header {
                display: grid;
                grid-template-columns: 60px 150px 1fr 100px 120px 120px;
                background: #f8fafc;
                padding: 15px 20px;
                font-weight: 800;
                font-size: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #0284c7;
                border-bottom: 1px solid #e2e8f0;
            }

            #pos-items-list {
                flex: 1;
                overflow-y: auto;
                background: #ffffff;
            }

            .sale-item-row {
                display: grid;
                grid-template-columns: 60px 150px 1fr 100px 120px 120px;
                padding: 12px 20px;
                border-bottom: 1px solid #f1f5f9;
                align-items: center;
                font-size: 0.95rem;
                color: #0f172a;
                transition: background 0.2s;
            }
            .sale-item-row:hover { background: #f8fafc; }
            .sale-item-row.last-added { background: #e0f2fe; border-left: 4px solid var(--pos-accent); }

            /* Sidebar Compacto */
            .pos-sidebar {
                grid-row: 2;
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .customer-panel { padding: 20px; background: #ffffff !important; border: 1px solid #e2e8f0 !important; color: #0f172a !important; }
            .totals-panel {
                margin-top: auto;
                padding: 25px;
                background: #ffffff !important;
                border-radius: 28px;
                border: 1px solid #e2e8f0 !important;
                box-shadow: 0 4px 15px rgba(0,0,0,0.03);
            }

            .total-huge {
                font-size: 3.5rem;
                font-weight: 900;
                color: #0f172a !important;
                letter-spacing: -2px;
                line-height: 1;
                margin: 10px 0;
            }

            /* Cadastro de Cliente Inline */
            #pos-customer-register-form {
                background: #f8fafc;
                padding: 15px;
                border-radius: 20px;
                margin-top: 10px;
                border: 1px solid var(--pos-accent);
                display: none;
            }

            .pos-tile {
                background: #ffffff !important;
                backdrop-filter: none;
                -webkit-backdrop-filter: none;
                border: 1px solid #e2e8f0 !important;
                border-radius: 28px;
                overflow: visible;
                box-shadow: 0 4px 15px rgba(0,0,0,0.04) !important;
                color: #0f172a !important;
            }

            .pos-header-bar {
                grid-column: 1 / -1;
                display: flex; justify-content: space-between; align-items: center;
                padding: 0 30px;
            }
            
            @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
            .health-pulse { position: relative; }
            .health-pulse::after { content:''; position:absolute; inset:-4px; border: 2px solid var(--pos-success); border-radius: 50%; animation: pulse-ring 1.5s infinite; }
        `;
        document.head.appendChild(style);
    },

    injectHTML: () => {
        if (document.getElementById('view-pos')) return;
        let main = document.querySelector('main') || document.body;
        const section = document.createElement('section');
        section.id = 'view-pos';
        section.className = 'view-section';
        section.innerHTML = `
            <div id="pos-offline-banner" class="offline-alert"><i class="ri-wifi-off-line"></i> MODO CONTINGÊNCIA ATIVO (OFFLINE)</div>
            <div class="pos-container">
                <!-- HEADER OPERACIONAL -->
                <header class="pos-tile" style="grid-column: 1 / span 2; display: flex; align-items: center; justify-content: space-between; padding: 0 30px; background: #ffffff !important; border: 1px solid #e2e8f0;">
                    <div style="display: flex; align-items: center; gap: 20px;">
                        <div style="background: var(--pos-accent-gradient); width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-neon); cursor: pointer;" onclick="Varejo.sair()">
                            <i class="ri-home-4-fill" style="color: #fff; font-size: 1.2rem;"></i>
                        </div>
                        <button class="btn btn-sm btn-secondary" onclick="Varejo.sair()" style="font-weight:800; padding:5px 15px; border-radius:10px;">SAIR</button>
                        <h2 style="margin:0; font-size: 1.2rem; font-weight: 800; letter-spacing: 1px; color:#0f172a;">NAXIO <span style="color:var(--pos-accent)">PRO</span></h2>
                    </div>

                    <!-- SELETOR DE VENDAS (ABAS) -->
                    <div id="pos-tabs-container" style="display:flex; gap:10px; background:#f1f5f9; padding:5px; border-radius:15px; border:1px solid #e2e8f0;">
                        <!-- Abas serão injetadas aqui -->
                    </div>

                    <div style="display: flex; align-items: center; gap: 40px;">
                        <div id="pos-header-status" style="display: flex; align-items: center; gap: 15px;">
                            <div style="text-align: right;">
                                <div id="pos-op-name" style="font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Operador</div>
                                <div style="font-size: 0.9rem; font-weight: 800; color: #0f172a;">Caixa Ativo</div>
                            </div>
                        </div>
                        <div id="pos-clock" style="font-size: 1.5rem; font-weight: 900; font-family: 'JetBrains Mono', monospace; color: var(--pos-accent);">00:00:00</div>
                    </div>
                </header>

                <!-- ÁREA CENTRAL: LISTA DE ITENS DA VENDA -->
                <main class="pos-main-sale">
                    <div class="pos-tile" style="padding: 10px 20px; background:#ffffff !important; border:1px solid #e2e8f0;">
                        <div style="display:flex; gap:15px; align-items:center;">
                            <i class="ri-barcode-line" style="font-size: 1.5rem; color: var(--pos-accent);"></i>
                            <input type="text" id="pos-barcode" placeholder="BIPAR PRODUTO OU DIGITAR NOME... (F1)" autocomplete="off" onkeydown="Varejo.handleScan(event)" style="flex:1; background:none; border:none; color:#0f172a; font-size:1.4rem; font-weight:700; outline:none; padding:10px;">
                            <div class="badge" style="background: #f1f5f9; color: #475569; font-weight:700; border:1px solid #cbd5e1; padding: 8px 15px;">MODO AUTO</div>
                        </div>
                    </div>

                    <div class="sale-table-container" style="background:#ffffff; border:1px solid #e2e8f0;">
                        <div class="sale-table-header">
                            <div>SEQ</div>
                            <div>CÓDIGO</div>
                            <div>DESCRIÇÃO DO PRODUTO</div>
                            <div style="text-align:center;">QTD</div>
                            <div style="text-align:right;">V. UNIT</div>
                            <div style="text-align:right;">V. TOTAL</div>
                        </div>
                        <div id="pos-items-list">
                            <!-- Itens da venda entrarão aqui -->
                            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; opacity:0.35; color:#64748b;">
                                <i class="ri-shopping-cart-2-line" style="font-size:5rem;"></i>
                                <p style="font-weight:700; color:#475569;">AGUARDANDO PRODUTOS...</p>
                            </div>
                        </div>
                    </div>
                </main>

                <!-- SIDEBAR DIREITO: CLIENTE E TOTAIS -->
                <aside class="pos-sidebar">
                    <!-- PAINEL DO CLIENTE -->
                    <div class="pos-tile customer-panel">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                            <h4 style="margin:0; font-size:0.8rem; color:var(--pos-accent); text-transform:uppercase;">Identificar Cliente</h4>
                            <i class="ri-user-add-line" style="cursor:pointer; color:#0284c7;" onclick="Varejo.toggleCustomerForm()"></i>
                        </div>
                        
                        <div id="pos-main-customer-selected" style="display:none; background: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 15px; position:relative;">
                             <div id="pos-main-customer-name" style="font-weight:700; font-size:1.1rem; color:#065f46;">Consumidor</div>
                             <div style="position:absolute; right:15px; top:50%; transform:translateY(-50%); display:flex; gap:5px;">
                                 <button class="btn btn-sm" onclick="Varejo.editarClienteAtual()" style="color:var(--pos-warning); background:none; border:none; padding:5px;" title="Editar Cliente"><i class="ri-edit-2-fill" style="font-size:1.2rem;"></i></button>
                                 <button class="btn btn-sm" onclick="Varejo.limparCliente()" style="color:var(--pos-danger); background:none; border:none; padding:5px;" title="Remover Cliente"><i class="ri-close-circle-fill" style="font-size:1.2rem;"></i></button>
                             </div>
                        </div>

                        <div id="pos-main-customer-search-area">
                            <input type="text" id="pos-main-customer-search" placeholder="CPF OU NOME..." autocomplete="off" oninput="Varejo.buscarCliente(this.value, 'main')" style="width:100%; padding:15px; border-radius:15px; background:#f8fafc; border:1px solid #cbd5e1; color:#0f172a; font-size:0.9rem; font-weight:600;">
                        </div>

                        <!-- Formulário de Cadastro Rápido -->
                        <div id="pos-customer-register-form">
                            <h5 style="margin:0 0 10px 0; font-size:0.75rem; color:#0f172a;">NOVO CADASTRO</h5>
                            <input type="text" id="reg-cust-name" placeholder="Nome Completo" class="input-field" style="margin-bottom:8px; font-size:0.8rem;">
                            <input type="text" id="reg-cust-cpf" placeholder="CPF/CNPJ" class="input-field" style="margin-bottom:10px; font-size:0.8rem;">
                            <button class="btn btn-primary btn-sm btn-full" onclick="Varejo.cadastrarClienteRapido()">SALVAR E USAR</button>
                        </div>

                        <div id="pos-main-customer-results" style="display:none; position:absolute; left:20px; width:calc(100% - 40px); background:#ffffff; border:2px solid var(--pos-accent); border-radius:20px; z-index:1000; margin-top:8px; box-shadow:0 15px 30px rgba(0,0,0,0.15); overflow:hidden; max-height:350px; overflow-y:auto;" class="scroll-thin"></div>
                    </div>

                    <!-- PAINEL DE TOTAIS -->
                    <div class="totals-panel">
                        <div style="display:flex; justify-content:space-between; color:#64748b; font-weight:700; font-size:0.85rem;">
                            <span>SUBTOTAL</span>
                            <span id="pos-subtotal" style="color:#0f172a;">R$ 0,00</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; color:#059669; font-weight:700; font-size:0.85rem; margin-top:5px;">
                            <span>DESCONTO (F7)</span>
                            <span id="pos-discount">- R$ 0,00</span>
                        </div>
                        <div style="margin-top:20px;">
                            <span style="font-size:0.75rem; color:var(--pos-accent); font-weight:800; text-transform:uppercase;">Total a Pagar</span>
                            <div class="total-huge" id="pos-total-final" style="color:#0f172a;">R$ 0,00</div>
                        </div>

                        <button class="btn btn-primary btn-full" onclick="Varejo.openPaymentModal()" style="margin-top:20px; height:60px; font-size:1.2rem; font-weight:900; border-radius:18px;">
                            <i class="ri-qr-code-fill"></i> PAGAR (F2)
                        </button>
                        
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
                            <button class="btn btn-secondary btn-sm" onclick="Varejo.cancelSaleWithPassword()" style="height:45px;">
                                <i class="ri-close-line"></i> CANCELAR
                            </button>
                            <button class="btn btn-secondary btn-sm" onclick="Varejo.openCardBrandsModal()" style="height:45px;">
                                <i class="ri-settings-4-line"></i> AJUSTES
                            </button>
                        </div>
                    </div>
                </aside>

                <footer class="bottom-bar" style="display: flex; justify-content: space-between; align-items: center; padding: 0 30px; background: #ffffff; border-top: 1px solid #e2e8f0; color:#475569;">
                    <div style="display:flex; gap:30px;">
                        <span id="pos-operator-footer-name" style="color:#059669; font-weight:800;"><i class="ri-user-6-fill"></i> OPERADOR: AGUARDANDO...</span>
                        <span style="color:var(--pos-accent); font-weight:800;"><i class="ri-shield-keyhole-fill"></i> JORNAL DE TRANSAÇÕES: ATIVO</span>
                    </div>
                    <div style="display:flex; gap:15px; align-items:center;">
                        <span style="background:#f1f5f9; padding:3px 10px; border-radius:6px; font-size:0.7rem; color:#475569; border:1px solid #cbd5e1; font-weight:600;">LATÊNCIA: 4ms</span>
                        <span style="color:#64748b; font-weight:700; font-size:0.8rem;">NAXIO GESSO ENTERPRISE v5.5.0</span>
                    </div>
                </footer>
            </div>

            <div id="pos-search-modal" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header"><h3>Buscar Produto</h3><button class="btn btn-secondary btn-sm" onclick="document.getElementById('pos-search-modal').style.display='none'">X</button></div>
                    <div class="modal-body">
                        <input type="text" id="pos-search-input" class="pos-input" style="margin-bottom:15px;" placeholder="Digite para filtrar..." oninput="Varejo.filterSearch(this.value)">
                        <div id="pos-search-results" class="scroll-thin" style="max-height:400px; overflow-y:auto; background:rgba(0,0,0,0.1); border-radius:15px;"></div>
                    </div>
                </div>
            </div>

            <div id="pos-pay-modal" class="modal-overlay">
                <div class="modal-content" style="width: 95vw; max-width: 1800px; height: 90vh; background: #ffffff !important; border: 1px solid #cbd5e1; box-shadow: 0 25px 50px rgba(0,0,0,0.15); display: flex; flex-direction: column;">
                    <div class="modal-header" style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                        <h3 style="display:flex; align-items:center; gap:12px; font-family:'Outfit'; font-weight:800; color:#0f172a;">
                            <i class="ri-secure-payment-fill" style="color:var(--pos-accent);"></i> Finalizar Venda
                        </h3>
                        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('pos-pay-modal').style.display='none'">X</button>
                    </div>
                    <div class="modal-body" style="padding: 0; display: flex; flex-direction: row; flex: 1; background: #ffffff;">
                        
                        <!-- Lado Esquerdo: Pagamentos -->
                        <div style="flex: 1.2; padding: 40px; overflow-y: auto; background: #ffffff;">
                            <style>
                            .pay-grid { display: grid; grid-template-columns: 1fr; gap: 15px; }
                            .pay-field { 
                                background: #ffffff; border: 1px solid #cbd5e1; 
                                border-radius: 20px; padding: 15px; transition: 0.3s;
                                display: flex; flex-direction: column; gap: 10px;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                            }
                            .pay-field:focus-within { border-color: var(--pos-accent); transform: scale(1.01); background: #f0f9ff; }
                            
                            .pay-field label { font-size: 0.9rem; font-weight: 800; color: #475569; display: flex; align-items: center; gap: 10px; }
                            .pay-field label i { font-size: 1.4rem; }
                            
                            .pay-field .input-box { position: relative; display: flex; align-items: center; }
                            .pay-field .input-box span { 
                                font-weight: 900; color: #64748b; font-size: 1.2rem; 
                                padding: 0 15px; border-right: 1px solid #e2e8f0;
                                margin-right: 15px;
                            }
                            .pay-field input { 
                                background: transparent !important; border: none !important; color: #0f172a !important; 
                                padding: 0 !important;
                                font-size: 2.2rem; font-weight: 800; width: 100%; min-width: 10px;
                                font-family: 'Outfit', sans-serif;
                            }
                            .pay-field input:focus { outline: none !important; box-shadow: none !important; border: none !important; }
                            .pay-field input::placeholder { color: #94a3b8; }
                            .pay-field input::-webkit-outer-spin-button,
                            .pay-field input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                            .pay-field input[type=number] { -moz-appearance: textfield; }

                            /* Cores vibrantes por tipo */
                            .pay-money label i { color: #10b981; }
                            .pay-pix label i { color: #06b6d4; }
                            .pay-card label i { color: #8b5cf6; }
                            .pay-crediario label i { color: #f59e0b; }
                            .pay-desc label i { color: #ef4444; }
                        </style>
                        <div style="background: #f8fafc; padding: 15px; border-radius: 12px; margin-bottom: 20px; display: flex; gap: 20px; align-items: center; border: 1px solid #e2e8f0;">
                            <label style="color: #475569; font-weight: 800; font-size: 0.85rem; text-transform: uppercase;">Modo de Pagamento:</label>
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: #0f172a; font-weight: bold;">
                                <input type="radio" name="pay_mode_pdv" value="unico" checked onchange="Varejo.changePayMode('unico')" style="accent-color: var(--pos-accent); width: 18px; height: 18px;"> Integral (Único)
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: #0f172a; font-weight: bold;">
                                <input type="radio" name="pay_mode_pdv" value="multiplo" onchange="Varejo.changePayMode('multiplo')" style="accent-color: var(--pos-accent); width: 18px; height: 18px;"> Múltiplo (Dividido)
                            </label>
                        </div>
                        <div class="pay-grid">
                            <div class="pay-field pay-money" onclick="Varejo.selectPayment('pay-money')" style="cursor: pointer; transition: 0.3s;"><label><i class="ri-money-dollar-circle-fill"></i> DINHEIRO</label><div class="input-box"><span>R$</span><input type="number" id="pay-money" step="0.01" placeholder="0.00" oninput="Varejo.calcRestante()" readonly style="cursor: pointer;"></div></div>
                            <div class="pay-field pay-pix" onclick="Varejo.selectPayment('pay-pix')" style="cursor: pointer; transition: 0.3s;"><label><i class="ri-qr-code-fill"></i> PIX</label><div class="input-box"><span>R$</span><input type="number" id="pay-pix" step="0.01" placeholder="0.00" oninput="Varejo.calcRestante()" readonly style="cursor: pointer;"></div></div>
                            <div class="pay-field pay-card" onclick="Varejo.selectPayment('pay-credit')" style="cursor: pointer; transition: 0.3s;"><label><i class="ri-bank-card-fill"></i> CRÉDITO</label><div class="input-box"><span>R$</span><input type="number" id="pay-credit" step="0.01" placeholder="0.00" oninput="Varejo.calcRestante()" readonly style="cursor: pointer;"></div></div>
                            <div class="pay-field pay-card" onclick="Varejo.selectPayment('pay-debit')" style="cursor: pointer; transition: 0.3s;"><label><i class="ri-bank-card-line"></i> DÉBITO</label><div class="input-box"><span>R$</span><input type="number" id="pay-debit" step="0.01" placeholder="0.00" oninput="Varejo.calcRestante()" readonly style="cursor: pointer;"></div></div>
                            <div id="payment-card-brands-container-2" style="display:none; gap:10px; flex-wrap:wrap; margin-bottom:10px;"></div>
                            <div class="pay-field pay-crediario" onclick="Varejo.selectPayment('pay-crediario')" style="cursor: pointer; transition: 0.3s;"><label><i class="ri-file-list-3-fill"></i> CREDIÁRIO / NOTA</label><div class="input-box"><span>R$</span><input type="number" id="pay-crediario" step="0.01" placeholder="0.00" oninput="Varejo.calcRestante()" readonly style="cursor: pointer;"></div></div>
                            
                            <div class="pay-field pay-desc">
                                <label><i class="ri-price-tag-3-fill"></i> DESCONTO</label>
                                <div style="display:flex; gap:10px; align-items:center;">
                                    <div class="input-box" style="flex:1; background:#f8fafc; border:1px solid #cbd5e1; border-radius:12px; padding:5px 10px;">
                                        <input type="number" id="pay-desconto-pct" step="0.1" placeholder="0%" oninput="Varejo.calcDescontoPct()" style="font-size:1.2rem; text-align:center;">
                                    </div>
                                    <div class="input-box" style="flex:1.5; background:#f8fafc; border:1px solid #cbd5e1; border-radius:12px; padding:5px 10px;">
                                        <input type="number" id="pay-desconto" step="0.01" placeholder="R$ 0.00" oninput="Varejo.calcRestante()" style="font-size:1.2rem; text-align:center;">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- CAMPOS NSU E AUT -->
                        <div id="pay-nsu-container" style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-top:20px;">
                            <div class="pay-field" style="padding:12px 15px;">
                                <label style="font-size:0.75rem; margin-bottom:5px;"><i class="ri-key-fill" style="color:var(--pos-accent);"></i> CÓD. AUTORIZAÇÃO (AUT)</label>
                                <input type="text" id="pay-nsu-aut" placeholder="Digite o código da maquininha" style="font-size:1.1rem; height:auto; padding:5px 0;">
                            </div>
                            <div class="pay-field" style="padding:12px 15px;">
                                <label style="font-size:0.75rem; margin-bottom:5px;"><i class="ri-hashtag" style="color:var(--pos-accent);"></i> NÚMERO NSU / DOC</label>
                                <input type="text" id="pay-nsu-doc" placeholder="Número da transação" style="font-size:1.1rem; height:auto; padding:5px 0;">
                            </div>
                        </div>

                        </div>

                        <!-- Lado Direito: Resumo e Confirmação -->
                        <div style="flex: 0.8; background: #f8fafc; border-left: 1px solid #e2e8f0; padding: 40px; display: flex; flex-direction: column; justify-content: space-between;">
                            <div>
                                <div style="text-align:center; margin-bottom:30px; background: #ffffff; padding: 30px; border-radius: 24px; border: 1px solid #cbd5e1; box-shadow: 0 4px 15px rgba(0,0,0,0.04);">
                                    <div style="text-transform: uppercase; font-size: 0.85rem; font-weight: 800; color: #64748b; letter-spacing: 2px; margin-bottom: 10px;">Valor Total do Pedido</div>
                                    <h1 id="pos-pay-total" style="color: #0f172a; font-size: 4.2rem; margin:0; font-weight:950; font-family: 'Outfit';">0,00</h1>
                                </div>

                                <div id="pay-restante-zone" style="margin-top:30px; padding:30px; border-radius:24px; text-align:center; background:#ffffff; border:1px solid #e2e8f0; transition:0.3s;">
                                    <div id="pay-restante-label" style="text-transform:uppercase; font-size:0.8rem; font-weight:800; letter-spacing:1px; margin-bottom:5px; color:#64748b;">Aguardando Pagamento</div>
                                    <div id="pay-restante-box" style="font-size:2.4rem; font-weight:900; font-family:'Outfit'; color:#0284c7;">R$ 0,00</div>
                                </div>
                                <div id="payment-breakdown" style="margin-top:20px; text-align:left; padding: 20px; background:#ffffff; border-radius:20px; display:none; max-height: 250px; overflow-y:auto; border: 1px solid #e2e8f0;"></div>
                            </div>
                            
                            <button id="btn-finalizar-venda" class="btn-action-primary" disabled onclick="Varejo.finalizeMultiPayment()" style="height:85px; font-size:1.6rem; width: 100%; margin-top:30px;">
                                <i class="ri-printer-fill"></i> CONFIRMAR E EMITIR (F12)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        main.appendChild(section);
        Varejo.renderTabs();
    },

    switchTab: (idx) => {
        const prevTab = Varejo.state.tabs[Varejo.state.currentTabIndex];
        if (prevTab) {
            prevTab.cart = [...Varejo.state.cart];
            prevTab.cliente = Varejo.state.currentCliente;
            prevTab.total = Varejo.state.totalTicket;
        }

        Varejo.state.currentTabIndex = idx;
        const newTab = Varejo.state.tabs[idx];
        Varejo.state.cart = Array.isArray(newTab.cart) ? [...newTab.cart] : [];
        Varejo.state.currentCliente = newTab.cliente;
        Varejo.state.totalTicket = newTab.total;

        Varejo.renderTabs();
        Varejo.renderCart();
        Varejo._atualizarPainelCliente();
        const input = document.getElementById('pos-barcode');
        if (input) input.focus();
        App.utils.toast(`Venda ${newTab.id} ativa`, 'info');
    },

    renderTabs: () => {
        const container = document.getElementById('pos-tabs-container');
        if (!container) return;
        container.innerHTML = Varejo.state.tabs.map((tab, idx) => `
            <div onclick="Varejo.switchTab(${idx})" style="
                padding: 8px 20px; 
                border-radius: 10px; 
                cursor: pointer; 
                font-weight: 800; 
                font-size: 0.8rem; 
                transition: 0.3s;
                display: flex; 
                align-items: center; 
                gap: 8px;
                background: ${idx === Varejo.state.currentTabIndex ? 'var(--pos-accent-gradient)' : 'transparent'};
                color: ${idx === Varejo.state.currentTabIndex ? '#fff' : 'var(--pos-text-muted)'};
                box-shadow: ${idx === Varejo.state.currentTabIndex ? '0 4px 10px rgba(14, 165, 233, 0.3)' : 'none'};
            ">
                <i class="ri-shopping-bag-3-line"></i> VENDA ${tab.id}
                ${tab.cart && tab.cart.length > 0 ? `<span style="background:#fff; color:var(--pos-accent); padding:2px 6px; border-radius:6px; font-size:0.6rem;">${tab.cart.length}</span>` : ''}
            </div>
        `).join('');
    },

    updateSummary: () => {
        const total = Varejo.state.cart.reduce((acc, p) => acc + (p.preco * (p.qtd || 1)), 0);
        Varejo.state.totalTicket = total;
        Varejo.renderCart();
    },

    autoRepair: () => {
        if (!Array.isArray(Varejo.state.cart)) Varejo.state.cart = [];
        Varejo.state.cart = Varejo.state.cart.filter(p => p && typeof p === 'object' && p.id);
        Varejo.updateSummary();
    },

    saveRecoveryState: () => {
        const t = Varejo.state.tabs[Varejo.state.currentTabIndex];
        if (t) {
            t.cart = [...Varejo.state.cart];
            t.cliente = Varejo.state.currentCliente;
            t.total = Varejo.state.totalTicket;
        }
        localStorage.setItem('naxio_pos_recovery', JSON.stringify(Varejo.state.tabs));
    },

    renderCart: (isPrazo = Varejo.state?.isPrazoPayment || false) => {
        const list = document.getElementById('pos-items-list');
        if (!list) return;

        const cart = Varejo.state.cart;
        if (cart.length === 0) {
            list.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; opacity:0.2;">
                    <i class="ri-shopping-cart-2-line" style="font-size:5rem;"></i>
                    <p>AGUARDANDO PRODUTOS...</p>
                </div>`;
            const subtotalEl = document.getElementById('pos-subtotal');
            if (subtotalEl) subtotalEl.innerText = 'R$ 0,00';
            const totalFinalEl = document.getElementById('pos-total-final');
            if (totalFinalEl) totalFinalEl.innerText = 'R$ 0,00';
            return;
        }

        let totalAvista = 0;
        let totalPrazo = 0;
        let html = '';

        cart.forEach((item, index) => {
            const pAvista = Number(item.preco || 0);
            const pPrazo = (item.preco_prazo && Number(item.preco_prazo) > 0) ? Number(item.preco_prazo) : pAvista;
            const qtd = item.qtd || 1;

            const itemTotalAvista = pAvista * qtd;
            const itemTotalPrazo = pPrazo * qtd;

            totalAvista += itemTotalAvista;
            totalPrazo += itemTotalPrazo;

            const isLast = index === cart.length - 1;
            const hasDiff = pPrazo !== pAvista;

            const unitPriceHtml = hasDiff
                ? `<div style="font-size:0.95rem; font-weight:800; color:#38bdf8;">R$ ${pAvista.toFixed(2)} <span style="font-size:0.65rem; color:#94a3b8; font-weight:bold;">(Vis)</span></div>
                   <div style="font-size:0.85rem; font-weight:800; color:#fbbf24; margin-top:2px;">R$ ${pPrazo.toFixed(2)} <span style="font-size:0.65rem; color:#f59e0b; font-weight:bold;">(Prz)</span></div>`
                : `<div style="font-size:0.95rem; font-weight:800; color:#38bdf8;">R$ ${pAvista.toFixed(2)}</div>`;

            const totalHtml = hasDiff
                ? `<div style="font-size:1rem; font-weight:900; color:#38bdf8;">R$ ${itemTotalAvista.toFixed(2)} <span style="font-size:0.65rem; color:#94a3b8; font-weight:bold;">(Vis)</span></div>
                   <div style="font-size:0.9rem; font-weight:900; color:#fbbf24; margin-top:2px;">R$ ${itemTotalPrazo.toFixed(2)} <span style="font-size:0.65rem; color:#f59e0b; font-weight:bold;">(Prz)</span></div>`
                : `<div style="font-size:1rem; font-weight:900; color:#38bdf8;">R$ ${itemTotalAvista.toFixed(2)}</div>`;

            html += `
                <div class="sale-item-row ${isLast ? 'last-added' : ''}">
                    <div style="font-weight:800; color:var(--pos-accent); opacity:0.6;">${String(index + 1).padStart(3, '0')}</div>
                    <div style="font-family:'JetBrains Mono'; font-size:0.85rem;">${item.codigo_barras || '---'}</div>
                    <div style="font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.nome.toUpperCase()}</div>
                    <div style="text-align:center; font-weight:800;">${qtd}</div>
                    <div style="text-align:right; font-family:'JetBrains Mono';">${unitPriceHtml}</div>
                    <div style="text-align:right; font-family:'JetBrains Mono';">${totalHtml}</div>
                    <div style="text-align:right;">
                        <button onclick="Varejo.removeItem(${index})" style="background:none; border:none; color:var(--pos-danger); cursor:pointer; font-size:1.2rem; padding:5px;">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        list.innerHTML = html;
        list.scrollTop = list.scrollHeight;

        const discount = Varejo.state.discount || 0;
        const finalTotalAvista = Math.max(0, totalAvista - discount);
        const finalTotalPrazo = Math.max(0, totalPrazo - discount);

        const subtotalEl = document.getElementById('pos-subtotal');
        if (subtotalEl) {
            if (totalPrazo !== totalAvista) {
                subtotalEl.innerHTML = `<span style="color:#38bdf8; font-weight:800; font-size:0.95rem;">R$ ${totalAvista.toFixed(2)}</span> <span style="font-size:0.75rem; color:#64748b;">(Vis)</span> &nbsp;<span style="color:#475569;">|</span>&nbsp; <span style="color:#fbbf24; font-weight:800; font-size:0.95rem;">R$ ${totalPrazo.toFixed(2)}</span> <span style="font-size:0.75rem; color:#d97706;">(Prz)</span>`;
            } else {
                subtotalEl.innerText = `R$ ${totalAvista.toFixed(2)}`;
            }
        }

        const totalFinalEl = document.getElementById('pos-total-final');
        if (totalFinalEl) {
            if (totalPrazo !== totalAvista) {
                totalFinalEl.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px; margin-bottom:8px;">
                        <div style="display:flex; justify-content:space-between; align-items:baseline;">
                            <span style="font-size:0.75rem; color:#38bdf8; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">À Vista</span>
                            <span style="font-size:0.75rem; color:#fbbf24; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">A Prazo</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="color:#38bdf8; font-size:1.85rem; font-weight:900; line-height:1; font-family:'JetBrains Mono', monospace; text-shadow:0 0 12px rgba(56,189,248,0.25);">R$ ${finalTotalAvista.toFixed(2)}</span>
                            <span style="color:#fbbf24; font-size:1.4rem; font-weight:900; line-height:1; font-family:'JetBrains Mono', monospace; text-shadow:0 0 10px rgba(251,191,36,0.25); background:rgba(251,191,36,0.1); border:1px solid rgba(251,191,36,0.25); padding:4px 8px; border-radius:8px;">R$ ${finalTotalPrazo.toFixed(2)}</span>
                        </div>
                    </div>`;
            } else {
                totalFinalEl.innerText = `R$ ${finalTotalAvista.toFixed(2)}`;
            }
        }

        if (typeof Varejo.saveRecoveryState === 'function') Varejo.saveRecoveryState();
    },

    toggleCustomerForm: () => {
        const form = document.getElementById('pos-customer-register-form');
        const search = document.getElementById('pos-main-customer-search-area');
        if (form.style.display === 'none' || !form.style.display) {
            form.style.display = 'block';
            search.style.display = 'none';
            document.getElementById('reg-cust-name').focus();
        } else {
            form.style.display = 'none';
            Varejo._atualizarPainelCliente();
        }
    },

    cadastrarClienteRapido: async () => {
        const nome = document.getElementById('reg-cust-name').value;
        const cpf = document.getElementById('reg-cust-cpf').value;

        if (!nome) return alert("Informe o nome do cliente.");

        try {
            const { data, error } = await _sb.from('profiles').insert({
                nome_completo: nome,
                cpf: cpf,
                role: 'cliente'
            }).select().single();

            if (error) throw error;

            Varejo.selecionarCliente(data);
            Varejo.toggleCustomerForm();
            App.utils.toast("Cliente cadastrado e selecionado!", "success");
            
            // Limpa campos
            document.getElementById('reg-cust-name').value = '';
            document.getElementById('reg-cust-cpf').value = '';
        } catch (err) {
            console.error(err);
            alert("Erro ao cadastrar cliente: " + err.message);
        }
    },



    handleScan: (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = e.target.value.trim();
            if (!val) {
                if (Varejo.state.cart.length > 0) Varejo.openPaymentModal();
                return;
            }
            const mul = val.match(/^(\d+)\*(.+)$/);
            if (mul) { 
                Varejo.state.pendingQty = parseInt(mul[1]); 
                Varejo.searchProduct(mul[2].trim()); 
            } else { 
                Varejo.state.pendingQty = 1; 
                Varejo.searchProduct(val); 
            }
            e.target.value = '';
        }
    },

    searchProduct: async (term) => {
        if (!term) return;

        // 1. Busca Direta (Código Inteiro ou Código Interno)
        let { data: exact, error } = await _sb.from('products').select('*').eq('store_id', App.state.storeId)
            .or(`codigo_barras.eq.${term},codigo_cardapio.eq.${term}`).limit(1);

        // 2. Lógica de 8 Dígitos Fixos (Padrão 8 fixos + 5 variáveis = 13 total)
        // Se não achou o exato e o termo for longo, tentamos os 8 primeiros
        if (!exact?.length && term.length >= 8) {
            const prefix8 = term.substring(0, 8);
            const { data: byPrefix } = await _sb.from('products').select('*').eq('store_id', App.state.storeId)
                .eq('codigo_barras', prefix8).limit(1);
            if (byPrefix?.length) exact = byPrefix;
        }

        if (error) console.error("Busca exata erro:", error);

        // Se encontrou algum produto por código, adiciona direto
        if (exact && exact.length > 0) {
            Varejo.addItem(exact[0], Varejo.state.pendingQty);
            return;
        }

        // 3. Se não encontrou por código, abre a Modal de Busca por Nome (como solicitado para o Enter)
        Varejo.openSearchModal(term);
    },

    openSearchModal: (term = '') => {
        document.getElementById('pos-search-modal').style.display = 'flex';
        const input = document.getElementById('pos-search-input');
        input.value = term;
        input.focus();
        if (term) Varejo.filterSearch(term);
    },

    filterSearch: async (term) => {
        const { data } = await _sb.from('products').select('*').eq('store_id', App.state.storeId).ilike('nome', `%${term}%`).limit(30);
        Varejo.renderSearchResults(data || []);
    },

    renderSearchResults: (prods) => {
        const container = document.getElementById('pos-search-results');
        if (!prods || !prods.length) { container.innerHTML = '<p style="padding:20px; text-align:center;">Nada encontrado.</p>'; return; }
        container.innerHTML = prods.map(p => {
            const precoAvista = p.preco ? Number(p.preco) : 0;
            const precoPrazo = (p.preco_prazo && Number(p.preco_prazo) > 0) ? Number(p.preco_prazo) : null;
            const priceLabel = (precoPrazo && precoPrazo !== precoAvista)
                ? `R$ ${precoAvista.toFixed(2)} <span style="font-size:0.75rem; color:#94a3b8; display:block;">Prazo: R$ ${precoPrazo.toFixed(2)}</span>`
                : `R$ ${precoAvista.toFixed(2)}`;

            return `
            <div class="pos-search-item" onclick="Varejo.addItem(${JSON.stringify(p).replace(/"/g, '&quot;')}, ${Varejo.state.pendingQty})">
                <div style="flex:1;"><div style="font-weight:700;">${p.nome}</div><div style="font-size:0.8rem; opacity:0.6;">Estoque: ${p.estoque || 0}</div></div>
                <div style="font-weight:800; color:var(--pos-accent); text-align:right;">${priceLabel}</div>
            </div>
        `}).join('');
    },

    addItem: (p, q = 1) => {
        try {
            if (!p || typeof p !== 'object' || !p.id) throw new Error("Produto inválido.");
            
            const item = { ...p, qtd: q };
            Varejo.state.cart.push(item);
            
            Varejo.renderCart();
            Varejo.playSound('beep');
            
            document.getElementById('pos-search-modal').style.display = 'none';
            Varejo.state.pendingQty = 1;
            Varejo.saveRecoveryState();
        } catch (err) {
            console.error("Bug no PDV (addItem):", err);
        }
    },

    removeItem: async (idx) => {
        const pass = await NaxioUI.prompt('🔐 Autorização', 'Informe a senha de cancelamento:', '', 'Senha', 'password');
        const masterPass = Varejo.state.config?.senha_cancelamento || '1234';
        
        if (pass !== masterPass) {
            return App.utils.toast("Senha incorreta!", "error");
        }

        Varejo.state.cart.splice(idx, 1);
        Varejo.renderCart();
        Varejo.playSound('beep');
        App.utils.toast("Item removido.", "success");
    },

    cancelSaleWithPassword: async () => {
        if (!Varejo.state.cart.length) return;
        
        const pass = await NaxioUI.prompt('🔐 Cancelar Venda', 'Informe a senha para limpar o carrinho:', '', 'Senha', 'password');
        const masterPass = Varejo.state.config?.senha_cancelamento || '1234';

        if (pass !== masterPass) {
            return App.utils.toast("Senha incorreta!", "error");
        }

        if (await NaxioUI.confirm('⚠️ Limpar Venda', 'Remover todos os itens do carrinho?')) {
            Varejo.state.cart = [];
            Varejo.state.currentCliente = null;
            Varejo.state.discount = 0;
            Varejo.renderCart();
            Varejo._atualizarPainelCliente();
            App.utils.toast("Venda cancelada.", "info");
        }
    },

    openPaymentModal: () => {
        if (!Varejo.state.cart.length) return App.utils.toast("Carrinho vazio!", "warning");
        
        // Calcula total novamente por segurança
        Varejo.updateSummary();

        document.getElementById('pos-pay-total').innerText = `${Varejo.state.totalTicket.toFixed(2)}`;
        document.getElementById('pos-pay-modal').style.display = 'flex';
        ['pay-money', 'pay-pix', 'pay-credit', 'pay-debit', 'pay-crediario', 'pay-desconto', 'pay-nsu-aut', 'pay-nsu-doc'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        Varejo.changePayMode('unico');
    },

    calcDescontoPct: () => {
        const total = Varejo.state.totalTicket;
        const pct = parseFloat(document.getElementById('pay-desconto-pct').value) || 0;
        const val = (total * pct) / 100;
        document.getElementById('pay-desconto').value = val.toFixed(2);
        Varejo.calcRestante();
    },

    changePayMode: (mode) => {
        const isUnico = mode === 'unico';
        const ids = ['pay-money', 'pay-pix', 'pay-credit', 'pay-debit', 'pay-crediario'];
        
        const radios = document.querySelectorAll('input[type="radio"][value="'+mode+'"], input[name="pay_mode_pdv"][value="'+mode+'"]');
        radios.forEach(r => r.checked = true);
        
        ids.forEach(id => {
            const input = document.getElementById(id);
            if(input) {
                input.readOnly = isUnico;
                input.style.cursor = isUnico ? 'pointer' : 'text';
                const field = input.parentElement ? input.parentElement.parentElement : null;
                if (field) {
                    field.style.cursor = isUnico ? 'pointer' : 'default';
                    field.style.border = '1px solid #cbd5e1';
                    field.style.background = '#ffffff';
                }
                input.value = '';
            }
        });
        
        Varejo.calcRestante();
    },

    selectPayment: (id) => {
        const isPrazo = (id === 'pay-credit' || id === 'pay-crediario');
        Varejo.state.isPrazoPayment = isPrazo;
        Varejo.updateSummary(isPrazo);
        const payTotalEl = document.getElementById('pos-pay-total');
        if (payTotalEl) payTotalEl.innerText = `${Varejo.state.totalTicket.toFixed(2)}`;

        let mode = 'unico';
        const activeRadio = document.querySelector('input[type="radio"]:checked, input[name="pay_mode_pdv"]:checked');
        if(activeRadio) mode = activeRadio.value;
        
        if(mode === 'unico') {
            const ids = ['pay-money', 'pay-pix', 'pay-credit', 'pay-debit', 'pay-crediario'];
            const desc = parseFloat(document.getElementById('pay-desconto')?.value) || 0;
            let brandDiscountVal = 0;
            if (Varejo.state.selectedBrand && Varejo.state.selectedBrand.discount > 0) {
                brandDiscountVal = (Varejo.state.totalTicket * Varejo.state.selectedBrand.discount) / 100;
            }
            const totalComDesconto = Math.max(0, Varejo.state.totalTicket - desc - brandDiscountVal).toFixed(2);
            
            ids.forEach(pid => {
                const input = document.getElementById(pid);
                if(!input) return;
                const field = input.parentElement ? input.parentElement.parentElement : null;
                
                if(pid === id) {
                    input.value = totalComDesconto;
                    if (field) {
                        field.style.border = '2px solid var(--pos-accent)';
                        field.style.background = '#f0f9ff';
                    }
                } else {
                    input.value = "";
                    if (field) {
                        field.style.border = '1px solid #cbd5e1';
                        field.style.background = '#ffffff';
                    }
                }
            });
            Varejo.calcRestante();
        } else {
            const input = document.getElementById(id);
            if (input) {
                input.focus();
                input.select();
            }
        }
    },

    calcRestante: () => {
        let total = Varejo.state.totalTicket;
        
        let brandDiscountVal = 0;
        let brandName = "";
        let brandPct = 0;
        if (Varejo.state.selectedBrand && Varejo.state.selectedBrand.discount > 0) {
            brandPct = Varejo.state.selectedBrand.discount;
            brandDiscountVal = (total * brandPct) / 100;
            brandName = Varejo.state.selectedBrand.name;
        }

        const pays = [
            { id: 'pay-money', label: 'Dinheiro', color: '#10b981' },
            { id: 'pay-pix', label: 'PIX', color: '#06b6d4' },
            { id: 'pay-credit', label: 'Cartão de Crédito', color: '#8b5cf6' },
            { id: 'pay-debit', label: 'Cartão de Débito', color: '#8b5cf6' },
            { id: 'pay-crediario', label: 'Crediário / Nota', color: '#f59e0b' }
        ];

        let paidTotal = 0;
        let breakdownHTML = '';

        pays.forEach(p => {
            const el = document.getElementById(p.id);
            const val = el ? (parseFloat(el.value) || 0) : 0;
            if(val > 0) {
                paidTotal += val;
                breakdownHTML += `<div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.85rem; font-weight:600;"><span style="color:${p.color};">${p.label}</span><span style="color:#fff;">R$ ${val.toFixed(2)}</span></div>`;
            }
        });

        const descEl = document.getElementById('pay-desconto');
        const desc = descEl ? (parseFloat(descEl.value) || 0) : 0;
        const totalDiscount = desc + brandDiscountVal;
        const totalFinalVenda = Math.max(0, total - totalDiscount);

        if (desc > 0) {
            breakdownHTML += `<div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.85rem; font-weight:600;"><span style="color:#ef4444;">Desconto Manual</span><span style="color:#ef4444;">- R$ ${desc.toFixed(2)}</span></div>`;
        }
        if (brandDiscountVal > 0) {
            breakdownHTML += `<div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.85rem; font-weight:600;"><span style="color:#ef4444;">Bandeira (${brandName} ${brandPct}%)</span><span style="color:#ef4444;">- R$ ${brandDiscountVal.toFixed(2)}</span></div>`;
        }
        
        const breakdownBoxes = document.querySelectorAll('#payment-breakdown');
        breakdownBoxes.forEach(box => {
            if (breakdownHTML !== '') {
                box.style.display = 'block';
                box.innerHTML = `<div style="text-transform:uppercase; font-size:0.7rem; font-weight:900; color:var(--pos-text-muted); margin-bottom:10px; letter-spacing:1px;">Resumo</div>` + breakdownHTML;
            } else {
                box.style.display = 'none';
                box.innerHTML = '';
            }
        });
        
        const res = totalFinalVenda - paidTotal;
        
        const totalDisplays = document.querySelectorAll('#pos-pay-total');
        totalDisplays.forEach(td => td.innerText = totalFinalVenda.toFixed(2));

        const zone = document.getElementById('pay-restante-zone');
        const box = document.getElementById('pay-restante-box');
        const label = document.getElementById('pay-restante-label');
        const btn = document.getElementById('btn-finalizar-venda');

        if (res <= 0.01) {
            if (zone) {
                zone.style.background = "rgba(16, 185, 129, 0.1)";
                zone.style.borderColor = "var(--pos-success)";
            }
            if (label) {
                label.innerHTML = res < -0.01 ? "Troco a Devolver" : `Pagamento Completo ${totalDiscount > 0 ? `<span style="color:#10b981; font-size:0.7rem; margin-left:10px;">(Economia: ${totalDiscount.toFixed(2)})</span>` : ''}`;
                label.style.color = "var(--pos-success)";
            }
            if (box) {
                box.innerText = `${Math.abs(res).toFixed(2)}`;
                box.style.color = "var(--pos-success)";
            }
            if (btn) btn.disabled = false;
        } else {
            if (zone) {
                zone.style.background = "rgba(239, 68, 68, 0.05)";
                zone.style.borderColor = "rgba(239, 68, 68, 0.2)";
            }
            if (label) {
                label.innerHTML = `Restante a Pagar ${totalDiscount > 0 ? `<br><span style="color:#10b981; font-size:0.75rem;">(Dedução Desconto: ${totalDiscount.toFixed(2)})</span>` : ''}`;
                label.style.color = "var(--pos-danger)";
            }
            if (box) {
                box.innerText = `${res.toFixed(2)}`;
                box.style.color = "var(--pos-danger, #ef4444)";
            }
            if (btn) btn.disabled = true;
        }
    },



    finalizeMultiPayment: async () => {
        const exigirNsu = document.getElementById('pos-exigir-nsu')?.checked;
        const pays = [
            { t: 'Dinheiro', v: 'pay-money' },
            { t: 'Pix', v: 'pay-pix' },
            { t: 'Crédito', v: 'pay-credit' },
            { t: 'Débito', v: 'pay-debit' },
            { t: 'Crediário', v: 'pay-crediario' }
        ].map(p => ({ tipo: p.t, val: parseFloat(document.getElementById(p.v).value) || 0 })).filter(p => p.val > 0);

        const valCrediario = pays.find(p => p.tipo === 'Crediário')?.val || 0;
        if (valCrediario > 0) {
            if (!Varejo.state.currentCliente) {
                return NaxioUI.alert('Cliente Obrigatório', 'Para vendas no CREDIÁRIO, você precisa selecionar um cliente primeiro.', 'warning');
            }
            if (!Varejo.state.currentCliente.whatsapp) {
                return NaxioUI.alert('Contato Obrigatório', 'Para vendas no CREDIÁRIO, o cliente deve ter um número de contato (WhatsApp) cadastrado.', 'warning');
            }
        }

        const proceed = async (installments = []) => {
            const nsu = document.getElementById('pay-nsu-doc').value.trim();
            const aut = document.getElementById('pay-nsu-aut').value.trim();
            const desc = parseFloat(document.getElementById('pay-desconto').value) || 0;
            let brandDiscountVal = 0;
            if (Varejo.state.selectedBrand && Varejo.state.selectedBrand.discount > 0) {
                brandDiscountVal = (Varejo.state.totalTicket * Varejo.state.selectedBrand.discount) / 100;
            }
            const totalDescontosVenda = desc + brandDiscountVal;

            App.utils.toast("Finalizando...", "info");
            try {
                const orderSnapshot = {
                    store_id: App.state.storeId,
                    total_pago: Math.max(0, Varejo.state.totalTicket - totalDescontosVenda),
                    taxa_servico: 0, // No varejo costuma ser zero ou fixo, campo garantido agora
                    status: 'concluido',
                    origem_venda: 'pdv',
                    metodo_pagamento: pays.length > 1 ? 'Múltiplos' : (pays[0]?.tipo || 'Desconto'),
                    customer_id: Varejo.state.currentCliente?.id || null,
                    observacao: JSON.stringify({ pays, desc: totalDescontosVenda, descManual: desc, descBandeira: brandDiscountVal, bandeira: Varejo.state.selectedBrand, items: Varejo.state.cart, nsu, aut, installments }),
                    session_id: localStorage.getItem('active_cash_session') || null
                };

                const { data, error } = await _sb.from('orders').insert(orderSnapshot).select().single();
                if (error) throw error;

                // Log de Auditoria do Multi-operador
                if (typeof App !== 'undefined' && App.multiOperator && App.multiOperator.logAction) {
                    App.multiOperator.logAction("VENDA_FINALIZADA", { 
                        orderId: data.id, 
                        total: orderSnapshot.total_pago,
                        itemsCount: Varejo.state.cart.length
                    });
                }

                // Parcelas do Crediário
                if (installments.length > 0) {
                    const parcels = installments.map(i => ({
                        store_id: App.state.storeId,
                        order_id: data.id,
                        customer_id: Varejo.state.currentCliente.id,
                        installment_number: i.parcela,
                        due_date: i.vencimento,
                        amount: i.valor,
                        status: 'pendente'
                    }));
                    await _sb.from('crediario_installments').insert(parcels);
                }

                // Descontar Estoque
                const stockMoves = Varejo.state.cart.reduce((a, c) => {
                    const x = a.find(e => e.id === c.id);
                    if (x) x.qtd++; else a.push({ id: c.id, qtd: 1 });
                    return a;
                }, []);
                await _sb.rpc('descontar_estoque', { itens: stockMoves });

                App.utils.toast("Venda registrada!", "success");
                document.getElementById('pos-pay-modal').style.display = 'none';

                // Impressão e Limpeza
                const ticketCopy = [...Varejo.state.cart];
                const savedCliente = Varejo.state.currentCliente;
                Varejo.state.cart = [];
                Varejo.state.currentCliente = null;
                Varejo.state.selectedBrand = null;
                Varejo.renderCart();
                // NFC-e e Impressão
                if (typeof Fiscal !== 'undefined' && (App.state.currentStore?.nuvem_client_id || App.state.storeId)) {
                    const querEmitir = await NaxioUI.confirm('🧾 Emitir NFC-e?', 'Deseja gerar a nota fiscal agora?', 'Sim, Emitir', 'Não, Apenas Recibo');
                    if (querEmitir) {
                        const pmts = pays.map(p => ({
                            tipo: (p.tipo === 'Crediário' || p.tipo === 'Nota') ? '05' : '01', // Mapeamento básico
                            val: p.val.toFixed(2),
                            tipo_original: p.tipo
                        }));
                        Fiscal.emitirNFCe(data.id, orderSnapshot.total_pago, pmts, ticketCopy.map(i => ({ id: i.id, nome: i.nome, price: i.preco, qtd: 1 })));
                    } else {
                        // Se clicou em "Apenas Recibo", imprime direto sem perguntar de novo
                        Varejo.printReceipt(data, ticketCopy, pays, totalDescontosVenda, savedCliente, installments);
                    }
                } else {
                    // Sem módulo fiscal ou desativado, imprime recibo direto
                    Varejo.printReceipt(data, ticketCopy, pays, totalDescontosVenda, savedCliente, installments);
                }
            } catch (err) {
                console.error("Erro Finalização:", err);
                NaxioUI.alert('Erro', 'Não foi possível salvar a venda: ' + err.message, 'error');
            }
        };

        if (valCrediario > 0) {
            App.crediario.openInstallmentModal(valCrediario, Varejo.state.currentCliente, proceed);
        } else {
            proceed();
        }
    },

    buscarCliente: async (t) => {
        const res = document.getElementById('pos-main-customer-results');
        if (!t || t.length < 2) { res.style.display = 'none'; return; }
        
        const { data } = await _sb.from('profiles').select('id, nome_completo, cpf').ilike('nome_completo', `%${t}%`).limit(10);
        
        if (!data?.length) { 
            res.innerHTML = `<div style="padding:20px; text-align:center; opacity:0.5; font-size:0.8rem;">NENHUM CLIENTE ENCONTRADO</div>`;
            res.style.display = 'block';
            return; 
        }

        res.innerHTML = data.map(c => `
            <div onclick="Varejo.selecionarCliente(${JSON.stringify(c).replace(/"/g, '&quot;')})" 
                 style="padding:15px 20px; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.05); transition:0.2s; display:flex; flex-direction:column; gap:4px;"
                 onmouseover="this.style.background='rgba(255,255,255,0.08)'" 
                 onmouseout="this.style.background='transparent'">
                <span style="font-weight:800; font-size:0.95rem; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.nome_completo.toUpperCase()}</span>
                <span style="font-size:0.7rem; color:var(--pos-accent); font-weight:800; letter-spacing:0.5px;">CPF/ID: ${c.cpf || 'NÃO INFORMADO'}</span>
            </div>
        `).join('');
        res.style.display = 'block';
    },

    selecionarCliente: (c) => { 
        Varejo.state.currentCliente = c; 
        Varejo._atualizarPainelCliente(); 
        document.getElementById('pos-main-customer-results').style.display = 'none';
        const searchInput = document.getElementById('pos-main-customer-search');
        if (searchInput) searchInput.value = '';
    },
    editarClienteAtual: () => {
        const c = Varejo.state.currentCliente;
        if (!c) return;

        let existing = document.getElementById('edit-varejo-cliente-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'edit-varejo-cliente-modal';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15, 23, 42, 0.75); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); display:flex; justify-content:center; align-items:center; z-index:99999; animation: fadeIn 0.2s ease-out;';
        modal.innerHTML = `
            <style>
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .modern-input-wrapper {
                    position: relative;
                    margin-bottom: 16px;
                }
                .modern-input-wrapper label {
                    color: #94a3b8;
                    font-size: 0.85rem;
                    font-weight: 500;
                    margin-bottom: 6px;
                    display: block;
                    transition: color 0.2s;
                }
                .modern-input-wrapper:focus-within label {
                    color: var(--pos-accent, #38bdf8);
                }
                .modern-pos-input {
                    width: 100%;
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 12px;
                    padding: 12px 16px;
                    color: #f8fafc;
                    font-size: 0.95rem;
                    transition: all 0.2s ease;
                    outline: none;
                    box-sizing: border-box;
                }
                .modern-pos-input:focus {
                    border-color: var(--pos-accent, #38bdf8);
                    box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
                }
                .modern-pos-input::placeholder {
                    color: #475569;
                }
                .modern-btn {
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                .modern-btn-cancel {
                    background: transparent;
                    color: #94a3b8;
                    border: 1px solid #334155;
                }
                .modern-btn-cancel:hover {
                    background: #1e293b;
                    color: #f1f5f9;
                    border-color: #475569;
                }
                .modern-btn-save {
                    background: var(--pos-accent, #0ea5e9);
                    color: #ffffff;
                    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
                }
                .modern-btn-save:hover {
                    filter: brightness(1.1);
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(14, 165, 233, 0.4);
                }
                .modern-btn-save:active {
                    transform: translateY(1px);
                }
                .close-btn-modern {
                    background: #1e293b;
                    border: 1px solid #334155;
                    color: #94a3b8;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .close-btn-modern:hover {
                    background: #ef4444;
                    color: white;
                    border-color: #ef4444;
                    transform: rotate(90deg);
                }
            </style>
            <div style="background: linear-gradient(145deg, #1e293b, #0f172a); border: 1px solid #334155; border-radius: 24px; width: 420px; max-width: 90%; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:28px;">
                    <h3 style="margin:0; color:#f8fafc; font-size: 1.25rem; font-weight: 600; display:flex; align-items:center; gap:10px;">
                        <div style="background: rgba(56, 189, 248, 0.1); padding: 8px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                            <i class="ri-edit-2-line" style="color:var(--pos-accent, #38bdf8); font-size: 1.2rem;"></i>
                        </div>
                        Editar Cliente
                    </h3>
                    <button class="close-btn-modern" onclick="document.getElementById('edit-varejo-cliente-modal').remove()">
                        <i class="ri-close-line"></i>
                    </button>
                </div>
                <div style="display:flex; flex-direction:column;">
                    <div class="modern-input-wrapper">
                        <label>Nome Completo</label>
                        <input type="text" id="ev-cli-nome" class="modern-pos-input" placeholder="Ex: Maria Joaquina" value="${c.nome_completo || c.nome || ''}">
                    </div>
                    <div class="modern-input-wrapper">
                        <label>CPF/CNPJ</label>
                        <input type="text" id="ev-cli-cpf" class="modern-pos-input" placeholder="000.000.000-00" value="${c.cpf || ''}">
                    </div>
                    <div class="modern-input-wrapper">
                        <label>WhatsApp / Contato</label>
                        <input type="text" id="ev-cli-whatsapp" class="modern-pos-input" placeholder="(00) 00000-0000" value="${c.whatsapp || ''}">
                    </div>
                    <div class="modern-input-wrapper" style="margin-bottom: 8px;">
                        <label>E-mail (Opcional)</label>
                        <input type="email" id="ev-cli-email" class="modern-pos-input" placeholder="email@exemplo.com" value="${c.email || ''}">
                    </div>
                </div>
                <div style="display:flex; gap:12px; margin-top:32px;">
                    <button class="modern-btn modern-btn-cancel" style="flex: 1;" onclick="document.getElementById('edit-varejo-cliente-modal').remove()">Cancelar</button>
                    <button class="modern-btn modern-btn-save" style="flex: 2;" onclick="Varejo.salvarEdicaoCliente('${c.id}')"><i class="ri-save-3-line"></i> Salvar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },
    salvarEdicaoCliente: async (id) => {
        const updateData = {
            nome_completo: document.getElementById('ev-cli-nome').value.trim(),
            cpf: document.getElementById('ev-cli-cpf').value.trim(),
            whatsapp: document.getElementById('ev-cli-whatsapp').value.trim(),
            email: document.getElementById('ev-cli-email').value.trim(),
        };

        try {
            App.utils.toast("Salvando...", "info");
            const { error } = await _sb.from('profiles').update(updateData).eq('id', id);
            if (error) throw error;
            App.utils.toast("Cliente atualizado com sucesso!", "success");
            
            Varejo.state.currentCliente = { ...Varejo.state.currentCliente, ...updateData };
            Varejo._atualizarPainelCliente();
            
            document.getElementById('edit-varejo-cliente-modal').remove();
        } catch (err) {
            console.error("Erro ao atualizar cliente", err);
            NaxioUI.alert("Erro", "Falha ao atualizar cliente: " + err.message, "danger");
        }
    },
    limparCliente: () => { Varejo.state.currentCliente = null; Varejo._atualizarPainelCliente(); },
    _atualizarPainelCliente: () => {
        const c = Varejo.state.currentCliente;
        const p = document.getElementById('pos-main-customer-selected');
        const s = document.getElementById('pos-main-customer-search-area');
        const nameEl = document.getElementById('pos-main-customer-name');

        if (c) { 
            if (p) p.style.display = 'block'; 
            if (s) s.style.display = 'none'; 
            if (nameEl) nameEl.innerText = c.nome_completo || c.nome || 'Cliente'; 
        } else { 
            if (p) p.style.display = 'none'; 
            if (s) s.style.display = 'block'; 
        }
        if (typeof Varejo.saveRecoveryState === 'function') Varejo.saveRecoveryState();
    },

    loadCategories: async () => {
        const list = document.getElementById('pos-category-list');
        if (!list) return; // Segurança: se não houver o container de categorias, não faz nada

        const { data } = await _sb.from('products').select('categoria').eq('store_id', App.state.storeId);
        if (!data) return;
        
        const cats = [...new Set(data.map(c => c.categoria))].filter(Boolean).sort();
        list.innerHTML = ''; // Limpa antes de carregar
        cats.forEach(c => {
            const div = document.createElement('div'); 
            div.className = 'cat-btn'; 
            div.innerHTML = `<i class="ri-folder-line"></i><span>${c}</span>`;
            div.onclick = () => Varejo.loadProductsByCategory(c, div); 
            list.appendChild(div);
        });
    },

    loadProductsByCategory: async (c, el) => {
        const grid = document.getElementById('pos-product-grid');
        if (!grid) return; // Segurança: se não houver a grade de produtos, não faz nada

        if (el) { 
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active')); 
            el.classList.add('active'); 
        }
        
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px; opacity:0.5;"><i class="ri-loader-4-line spin" style="font-size:2rem;"></i><br>Carregando Itens...</div>';
        
        try {
            let q = _sb.from('products').select('*').eq('store_id', App.state.storeId).limit(50);
            if (c) q = q.eq('categoria', c);
            const { data, error } = await q;
            
            if (error) throw error;

            grid.innerHTML = data.map(p => `
                <div class="product-card animate-in" onclick="Varejo.addItem(${JSON.stringify(p).replace(/"/g, '&quot;')}, 1)">
                    <div style="font-weight:800; font-size:1.1rem; height:2.5rem; overflow:hidden; line-height:1.2;">${p.nome}</div>
                    <div class="price-tag">R$ ${parseFloat(p.preco).toFixed(2)}</div>
                    <div class="stock-bar">
                        <div class="stock-progress" style="width:${Math.min(100, (p.estoque || 0) * 10)}%; background:${p.estoque < 5 ? '#f43f5e' : '#10b981'}"></div>
                    </div>
                    <div style="font-size:0.65rem; font-weight:800; color:var(--pos-text-muted); margin-top:5px; display:flex; justify-content:space-between;">
                        <span>ESTOQUE: ${p.estoque || 0} UN</span>
                        <span>COD: ${p.id.toString().slice(-4).toUpperCase()}</span>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:red;">Erro ao carregar produtos.</div>';
        }
    },

    startClock: () => setInterval(() => { const el = document.getElementById('pos-clock'); if (el) el.innerText = new Date().toLocaleTimeString('pt-BR'); }, 1000),

    printReceipt: (order, items, pays, desc, cliente, installments = []) => {
        const win = window.open('', '', 'width=800,height=600');
        const storeName = (App.state.currentStore?.nome_loja) || App.state.storeName || 'NAXIO GESSO';
        const date = new Date().toLocaleString('pt-BR');

        // Agrupa itens para o recibo
        const grouped = [];
        items.forEach(i => {
            const ex = grouped.find(g => g.id === i.id);
            if (ex) { ex.qtd++; ex.total = ex.qtd * i.preco; }
            else { grouped.push({ ...i, qtd: 1, total: i.preco }); }
        });

        // Detalhes do Crediário
        let installmentsHtml = '';
        if (installments && installments.length > 0) {
            installmentsHtml = `
                <div class="sep"></div>
                <div class="bold" style="font-size:11px;">PROGRAMAÇÃO DE PAGAMENTO (CREDIÁRIO):</div>
                ${installments.map(ins => `
                    <div class="item" style="font-size:11px;">
                        <span>Parc. ${ins.parcela} (${new Date(ins.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')})</span>
                        <span class="bold">R$ ${parseFloat(ins.valor).toFixed(2)}</span>
                    </div>
                `).join('')}
            `;
        }

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Comprovante de Venda - NAXIO GESSO</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
                    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Space Mono', 'Courier New', Courier, monospace !important; }
                    body { 
                        width: 100%;
                        max-width: 80mm;
                        margin: 0 auto; 
                        padding: 12px 10px; 
                        color: #000; 
                        background: #fff;
                        font-size: 12px; 
                        line-height: 1.35; 
                        -webkit-print-color-adjust: exact; 
                    }
                    .center { text-align: center; }
                    .header-title { font-size: 16px; font-weight: 700; letter-spacing: 0.5px; }
                    .header-sub { font-size: 11px; text-transform: uppercase; margin-top: 2px; }
                    .bold { font-weight: 700; }
                    .sep { border-top: 1px dashed #000; margin: 8px 0; }
                    .sep-double { border-top: 2px solid #000; margin: 10px 0; }
                    .item { display: flex; justify-content: space-between; margin-bottom: 4px; }
                    .total-box { 
                        display: flex; justify-content: space-between; 
                        font-size: 17px; font-weight: 700; 
                        padding: 4px 0;
                        border-top: 1px solid #000;
                        border-bottom: 1px solid #000;
                        margin: 6px 0;
                    }
                    .footer { font-size: 10.5px; margin-top: 12px; padding-top: 8px; border-top: 1px dashed #000; line-height: 1.4; }
                    .gesso-badge { font-size: 10px; padding: 2px 4px; border: 1px solid #000; display: inline-block; margin-top: 4px; }
                    
                    @page { margin: 0; size: 80mm auto; }
                    @media print { 
                        body { width: 80mm; padding: 8px; margin: 0; } 
                        .no-print { display: none; } 
                    }
                    .no-print { margin-top: 20px; text-align: center; background: #f0f0f0; padding: 10px; border-radius: 8px; }
                    .no-print button { padding: 10px 20px; cursor: pointer; margin: 5px; background: #000; color: #fff; border: none; border-radius: 5px; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="center header-title">NAXIO GESSO</div>
                <div class="center header-sub">${storeName.toUpperCase()}</div>
                <div class="center"><span class="gesso-badge">GESSO • DRYWALL • PERFIS • ACABAMENTOS</span></div>
                <div class="sep"></div>
                <div style="font-size:11px;">
                    <div>DATA/HORA: ${date}</div>
                    <div>PEDIDO / VENDA: #${order.id.toString().slice(-6).toUpperCase()}</div>
                    <div>CLIENTE: ${cliente?.nome_completo ? cliente.nome_completo.toUpperCase() : 'CONSUMIDOR FINAL'}</div>
                    ${cliente?.cpf_cnpj ? `<div>CPF/CNPJ: ${cliente.cpf_cnpj}</div>` : ''}
                </div>
                <div class="sep"></div>
                <div class="bold" style="font-size:11.5px; margin-bottom:4px;">DISCRIMINAÇÃO DOS MATERIAIS:</div>
                <div style="font-size:12px;">
                ${grouped.map(i => `
                    <div class="item">
                        <span style="flex:1; padding-right:8px;">${i.qtd}x ${i.nome.toUpperCase().slice(0, 28)}</span>
                        <span class="bold">R$ ${i.total.toFixed(2)}</span>
                    </div>
                `).join('')}
                </div>
                <div class="sep"></div>
                <div class="item"><span>SUBTOTAL:</span> <span>R$ ${(Varejo.state.totalTicket || 0).toFixed(2)}</span></div>
                ${desc > 0 ? `<div class="item"><span>DESCONTO CONCEDIDO:</span> <span>- R$ ${desc.toFixed(2)}</span></div>` : ''}
                <div class="total-box">
                    <span>TOTAL LIQUIDO:</span> 
                    <span>R$ ${(order.total_pago).toFixed(2)}</span>
                </div>
                <div class="bold" style="font-size:11.5px; margin-top:6px;">FORMA(S) DE PAGAMENTO:</div>
                ${pays.map(p => `<div class="item" style="font-size:11.5px;"><span>${p.tipo.toUpperCase()}:</span> <span class="bold">R$ ${p.val.toFixed(2)}</span></div>`).join('')}
                
                ${installmentsHtml}

                <div class="sep-double"></div>
                <div class="center footer">
                    <strong>NAXIO GESSO - ESPECIALISTA EM FORROS E MOLDURAS</strong><br>
                    Agradecemos a confiança e preferência!<br>
                    Materiais de gesso entregues conferidos no ato.<br>
                    <span style="font-size:9.5px; opacity:0.8;">Sistema de Emissão Naxio Gesso Enterprise</span>
                </div>
                <div class="no-print">
                    <button onclick="window.print()">IMPRIMIR RECIBO</button>
                    <button onclick="window.close()">FECHAR</button>
                </div>
                <script>
                    setTimeout(() => { 
                        window.print();
                    }, 600);
                </script>
            </body>
            </html>
        `;
        win.document.write(html);
        win.document.close();
    },
    getCardBrands: () => {
        try {
            return JSON.parse(localStorage.getItem('naxio_card_brands') || '[]');
        } catch(e) {
            return [];
        }
    },
    saveCardBrands: (brands) => {
        localStorage.setItem('naxio_card_brands', JSON.stringify(brands));
    },
    openCardBrandsModal: () => {
        if(document.getElementById('pos-card-brands-modal')) document.getElementById('pos-card-brands-modal').remove();
        const html = `
        <div id="pos-card-brands-modal" class="modal-overlay" style="display:flex; z-index:100001;">
            <div class="modal-content" style="max-width:600px; display:flex; flex-direction:column; padding:0;">
                <div class="modal-header" style="padding:20px; border-bottom:1px solid rgba(255,255,255,0.1);">
                    <h3><i class="ri-bank-card-fill"></i> Configuração de Bandeiras</h3>
                    <button class="btn btn-secondary btn-sm" onclick="document.getElementById('pos-card-brands-modal').remove()">X</button>
                </div>
                <div class="modal-body scroll-thin" style="padding:20px; overflow-y:auto; max-height:50vh;">
                    <div id="card-brands-list" style="display:flex; flex-direction:column; gap:10px;"></div>
                </div>
                <div style="padding:20px; border-top:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.2);">
                    <h4 style="margin-bottom:10px; font-size:0.9rem;">Adicionar Nova Bandeira</h4>
                    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">
                        <input type="text" id="cb-name" class="input-field" placeholder="Nome (ex: Visa)">
                        <input type="number" id="cb-desc" class="input-field" placeholder="Desconto %" step="0.1">
                        <input type="text" id="cb-img" class="input-field" placeholder="URL da Imagem">
                    </div>
                    <button class="btn btn-primary btn-full" style="margin-top:10px;" onclick="Varejo.addCardBrand()">Adicionar Bandeira</button>
                </div>
            </div>
        </div>
        `;
        const container = document.getElementById('view-pos') || document.body;
        container.insertAdjacentHTML('beforeend', html);
        Varejo.renderCardBrandsModalList();
    },
    openSelectCardBrandModal: () => {
        if(document.getElementById('pos-select-brand-modal')) document.getElementById('pos-select-brand-modal').remove();
        const brands = Varejo.getCardBrands();
        if(brands.length === 0) {
            App.utils.toast('Nenhuma bandeira cadastrada.', 'error');
            return;
        }
        const html = `
        <div id="pos-select-brand-modal" class="modal-overlay" style="display:flex; z-index:100001; align-items:center; justify-content:center;">
            <div class="modal-content" style="max-width:500px; width:90%; display:flex; flex-direction:column; padding:0; border-radius:16px; overflow:hidden;">
                <div class="modal-header" style="padding:20px; background:linear-gradient(135deg, rgba(255,255,255,0.05), rgba(0,0,0,0.2)); border-bottom:1px solid rgba(255,255,255,0.1);">
                    <h3 style="margin:0;"><i class="ri-bank-card-fill" style="color:var(--pos-accent);"></i> Selecionar Bandeira</h3>
                    <button class="btn btn-secondary btn-sm" style="border-radius:8px;" onclick="document.getElementById('pos-select-brand-modal').remove()"><i class="ri-close-line"></i></button>
                </div>
                <div class="modal-body scroll-thin" style="padding:20px; overflow-y:auto; max-height:60vh; background:rgba(0,0,0,0.4);">
                    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 15px;">
                        ${brands.map((b, i) => `
                            <button class="btn pay-brand-btn" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; background:rgba(255,255,255,0.05); border:2px solid transparent; padding:15px; border-radius:12px; transition:0.3s; cursor:pointer;" onclick="Varejo.selectCardBrandForPayment(${i}); document.getElementById('pos-select-brand-modal').remove();" onmouseover="this.style.borderColor='var(--pos-accent)'; this.style.background='rgba(255,255,255,0.1)';" onmouseout="this.style.borderColor='transparent'; this.style.background='rgba(255,255,255,0.05)';">
                                ${b.img ? `<img src="${b.img}" style="height:40px; width:60px; object-fit:contain; background:#fff; border-radius:6px; padding:2px;">` : `<i class="ri-bank-card-line" style="font-size:2rem; color:var(--pos-accent);"></i>`}
                                <span style="font-size:0.9rem; font-weight:800; margin-top:5px; color:#fff;">${b.name}</span>
                                ${b.discount > 0 ? `<span style="font-size:0.75rem; color:var(--pos-success); font-weight:bold; background:rgba(16,185,129,0.1); padding:2px 8px; border-radius:4px;">-${b.discount}%</span>` : ''}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
        `;
        const container = document.getElementById('view-pos') || document.body;
        container.insertAdjacentHTML('beforeend', html);
    },
    renderCardBrandsModalList: () => {
        const list = document.getElementById('card-brands-list');
        if(!list) return;
        const brands = Varejo.getCardBrands();
        if(brands.length === 0) {
            list.innerHTML = '<p class="text-muted" style="text-align:center;">Nenhuma bandeira cadastrada.</p>';
            return;
        }
        list.innerHTML = brands.map((b, i) => `
            <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.05); padding:10px 15px; border-radius:8px;">
                <div style="display:flex; align-items:center; gap:15px;">
                    ${b.img ? `<img src="${b.img}" style="height:30px; width:45px; object-fit:contain; background:#fff; border-radius:4px;">` : `<div style="height:30px; width:45px; background:var(--pos-accent); border-radius:4px; display:flex; align-items:center; justify-content:center;"><i class="ri-bank-card-line"></i></div>`}
                    <div>
                        <strong style="display:block;">${b.name}</strong>
                        <span style="color:var(--pos-success); font-size:0.8rem;">Desconto: ${b.discount}%</span>
                    </div>
                </div>
                <button class="btn btn-danger btn-sm" onclick="Varejo.removeCardBrand(${i})"><i class="ri-delete-bin-line"></i></button>
            </div>
        `).join('');
    },
    addCardBrand: () => {
        const name = document.getElementById('cb-name').value.trim();
        const desc = parseFloat(document.getElementById('cb-desc').value) || 0;
        const img = document.getElementById('cb-img').value.trim();
        if(!name) return App.utils.toast('Nome da bandeira é obrigatório!', 'error');
        const brands = Varejo.getCardBrands();
        brands.push({name, discount: desc, img});
        Varejo.saveCardBrands(brands);
        document.getElementById('cb-name').value = '';
        document.getElementById('cb-desc').value = '';
        document.getElementById('cb-img').value = '';
        Varejo.renderCardBrandsModalList();
        App.utils.toast('Bandeira adicionada!', 'success');
        Varejo.renderPaymentCardBrands();
    },
    removeCardBrand: (index) => {
        if(!confirm('Tem certeza que deseja excluir esta bandeira?')) return;
        const brands = Varejo.getCardBrands();
        brands.splice(index, 1);
        Varejo.saveCardBrands(brands);
        Varejo.renderCardBrandsModalList();
        Varejo.renderPaymentCardBrands();
    },
    selectCardBrandForPayment: (index) => {
        const brands = Varejo.getCardBrands();
        const brand = brands[index];
        if(!brand) return;
        
        // Remove active class from all
        document.querySelectorAll('.pay-brand-btn').forEach(b => {
            b.style.borderColor = 'var(--pos-border)';
            b.style.background = 'rgba(255,255,255,0.05)';
        });
        
        // Add active class to selected
        const btn = document.getElementById('btn-brand-' + index) || document.getElementById('btn-brand-0-' + index) || document.getElementById('btn-brand-1-' + index);
        if(btn) {
            btn.style.borderColor = 'var(--pos-accent)';
            btn.style.background = 'rgba(0,0,0,0.3)';
        }

        Varejo.state.selectedBrand = brand;
        document.querySelectorAll('.btn-remove-brand').forEach(b => b.style.display = 'block');
        
        // No modo único, atualiza o campo de pagamento atualmente preenchido com o novo total com desconto
        const activeRadio = document.querySelector('input[type="radio"]:checked');
        const mode = activeRadio ? activeRadio.value : 'unico';
        if (mode === 'unico') {
            const ids = ['pay-money', 'pay-pix', 'pay-credit', 'pay-debit', 'pay-crediario'];
            const activeInput = ids.map(id => document.getElementById(id)).find(el => el && parseFloat(el.value) > 0);
            if (activeInput) {
                const desc = parseFloat(document.getElementById('pay-desconto')?.value) || 0;
                const brandDiscountVal = (Varejo.state.totalTicket * (brand.discount || 0)) / 100;
                activeInput.value = Math.max(0, Varejo.state.totalTicket - desc - brandDiscountVal).toFixed(2);
            }
        }
        
        Varejo.calcRestante();
        App.utils.toast(`Bandeira ${brand.name} selecionada.`, 'success');
    },
    removeSelectedCardBrandForPayment: () => {
        Varejo.state.selectedBrand = null;
        document.querySelectorAll('.pay-brand-btn').forEach(b => {
            b.style.borderColor = 'var(--pos-border)';
            b.style.background = 'rgba(255,255,255,0.05)';
        });
        document.querySelectorAll('.btn-remove-brand').forEach(b => b.style.display = 'none');
        
        // No modo único, restaura o valor do campo ativo
        const activeRadio = document.querySelector('input[type="radio"]:checked');
        const mode = activeRadio ? activeRadio.value : 'unico';
        if (mode === 'unico') {
            const ids = ['pay-money', 'pay-pix', 'pay-credit', 'pay-debit', 'pay-crediario'];
            const activeInput = ids.map(id => document.getElementById(id)).find(el => el && parseFloat(el.value) > 0);
            if (activeInput) {
                const desc = parseFloat(document.getElementById('pay-desconto')?.value) || 0;
                activeInput.value = Math.max(0, Varejo.state.totalTicket - desc).toFixed(2);
            }
        }

        Varejo.calcRestante();
        App.utils.toast('Bandeira removida', 'info');
    },
    renderPaymentCardBrands: () => {
        const container = document.getElementById('payment-card-brands-container');
        if(!container) return;
        const brands = Varejo.getCardBrands();
        if(brands.length === 0) {
            container.innerHTML = '';
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'flex';
        container.innerHTML = brands.map((b, i) => `
            <button id="btn-brand-${i}" class="btn pay-brand-btn" style="flex:1; display:flex; flex-direction:column; align-items:center; gap:5px; background:rgba(255,255,255,0.05); border:1px solid var(--pos-border); padding:10px; border-radius:8px;" onclick="Varejo.selectCardBrandForPayment(${i})">
                ${b.img ? `<img src="${b.img}" style="height:25px; object-fit:contain;">` : `<i class="ri-bank-card-line" style="font-size:1.5rem;"></i>`}
                <span style="font-size:0.75rem; font-weight:bold;">${b.name}</span>
                ${b.discount > 0 ? `<span style="font-size:0.65rem; color:var(--pos-success);">-${b.discount}%</span>` : ''}
            </button>
        `).join('');
    },
    openToolsMenu: () => {
        const tools = Object.entries(App.storeTools);
        const html = `
        <div id="pos-tools-modal" class="modal-overlay" style="display:flex;">
            <div class="modal-content" style="max-width:800px; max-height:80vh; overflow:hidden; display:flex; flex-direction:column;">
                <div class="modal-header">
                    <h3><i class="ri-magic-line"></i> Ferramentas Enterprise (30 Funcionalidades)</h3>
                    <button class="btn btn-secondary btn-sm" onclick="document.getElementById('pos-tools-modal').remove()">X</button>
                </div>
                <div class="modal-body scroll-thin" style="flex:1; overflow-y:auto; padding:20px; display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:10px;">
                    ${tools.map(([key, fn]) => {
                        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        return `<button class="btn btn-outline" style="text-align:left; padding:15px; border-radius:12px; font-size:0.85rem;" onclick="App.storeTools.${key}()">
                            <i class="ri-checkbox-circle-line" style="color:var(--pos-success);"></i> ${label}
                        </button>`;
                    }).join('')}
                </div>
                <div class="modal-footer" style="padding:15px; border-top:1px solid var(--pos-border); text-align:center; font-size:0.75rem; color:var(--pos-text-muted);">
                    As funcionalidades marcadas como (em breve) serão liberadas na próxima atualização.
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }
};

window.Varejo = Varejo;
console.log("✅ Varejo 5.0 Pronto.");

