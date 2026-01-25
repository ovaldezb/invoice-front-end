import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MercadoPagoService } from '../../services/mercado-pago.service';
import { PaymentConfig } from '../../models/payment-config';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-configura-pagos',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './configura-pagos.component.html',
})
export class ConfiguraPagosComponent implements OnInit {
    configs: PaymentConfig[] = [];
    isLoading: boolean = false;
    isSaving: boolean = false;
    showModal: boolean = false;

    newConfig: PaymentConfig = {
        nombre_pago: '',
        cantidad: 0,
        codigo_sat: '',
        descripcion_sat: ''
    };

    constructor(private mercadoPagoService: MercadoPagoService) { }

    ngOnInit(): void {
        this.loadConfigs();
    }

    loadConfigs() {
        this.isLoading = true;
        this.mercadoPagoService.getPaymentConfigs().subscribe({
            next: (res) => {
                if (res.body && res.body.payment_config) {
                    this.configs = res.body.payment_config;
                } else {
                    this.configs = []
                }
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading configs', err);
                this.isLoading = false;
            }
        });
    }

    openModal() {
        this.newConfig = { nombre_pago: '', cantidad: 0, codigo_sat: '', descripcion_sat: '' };
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }

    saveConfig() {
        if (!this.isValid()) return;

        this.isSaving = true;
        const updatedConfigs = [...this.configs, this.newConfig];

        this.mercadoPagoService.savePaymentConfigs(updatedConfigs).subscribe({
            next: () => {
                this.configs = updatedConfigs;
                this.isSaving = false;
                this.closeModal();
                Swal.fire({
                    icon: 'success',
                    title: 'Guardado',
                    text: 'Configuración agregada correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            },
            error: (err) => {
                console.error('Error saving config', err);
                this.isSaving = false;
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo guardar la configuración'
                });
            }
        });
    }

    deleteConfig(index: number) {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esto",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar'
        }).then((result) => {
            if (result.isConfirmed) {
                const updatedConfigs = this.configs.filter((_, i) => i !== index);
                this.mercadoPagoService.savePaymentConfigs(updatedConfigs).subscribe({
                    next: () => {
                        this.configs = updatedConfigs;
                        Swal.fire(
                            'Eliminado!',
                            'La configuración ha sido eliminada.',
                            'success'
                        )
                    },
                    error: (err) => {
                        Swal.fire(
                            'Error!',
                            'No se pudo eliminar.',
                            'error'
                        )
                    }
                });
            }
        })
    }

    isValid(): boolean {
        return this.newConfig.nombre_pago?.trim() !== '' &&
            this.newConfig.cantidad > 0 &&
            this.newConfig.codigo_sat?.trim() !== '' &&
            this.newConfig.descripcion_sat?.trim() !== '';
    }
}
