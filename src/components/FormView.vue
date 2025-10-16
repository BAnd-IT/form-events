<template>
    <div class="form-view d-flex flex-column g-5">

        <div class="form-view__form d-flex flex-wrap">
            <div class="container">
                <div class="row">
                    <div class="col-2"><input v-model="localPrice" type="number" placeholder="Цена" class="form-input"
                            @input="handleInputChange('price')" />
                    </div>
                    <div class="col-2"><input v-model="localQty" type="number" placeholder="Количество"
                            class="form-input" @input="handleInputChange('qty')" />
                    </div>
                    <div class="col-2"><input v-model="localAmount" type="number" placeholder="Сумма" class="form-input"
                            @input="handleInputChange('amount')" />
                    </div>
                    <div class="col-6"><button class="form-button" :disabled="!isSubmittable" @click="handleSubmit">{{
                        isSubmitting ?
                            'Отправка...' : 'Отправить'
                            }}</button></div>
                </div>
            </div>
        </div>

        <div class="form-view__labels d-flex flex-wrap">
            <div class="container">
                <div class="row">
                    <div class="col-2">Цена: {{ localPrice }}</div>
                    <div class="col-2">Количество: {{ localQty }}</div>
                    <div class="col-2">Сумма: {{ localAmount }}</div>
                    <div class="col-6 scrolled-block monospace-font">{{ localStorageContent }}</div>
                </div>
            </div>
        </div>

        <div class="form-view__events events-list">

            <div v-for="event in events" :key="event.id" class="events-list__item">
                <div>{{ formatTime(event.timestamp) }}</div>
                <div>{{ getEventType(event.type) }}</div>
                <div>Сообщение: {{ event.message }}</div>
                <div v-if="event.data">Данные: <span class="monospace-font">{{ JSON.stringify(event.data) }}</span>
                </div>
                <div class="event-storage scrolled-block">LocalStorage: <span class="monospace-font">{{
                    event.localStorage }}</span>
                </div>
            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { FormData, EventLog, FieldType, TimeoutHandle } from '../types';

const localPrice = ref(0);
const localQty = ref(0);
const localAmount = ref(0);
const counter = ref(0);
const isSubmitting = ref(false);
const events = ref<EventLog[]>([]);
const changeOrder = ref<FieldType[]>(['price', 'qty', 'amount']);
const localStorageContent = ref('');

let priceTimeout: TimeoutHandle | null = null;
let qtyTimeout: TimeoutHandle | null = null;
let amountTimeout: TimeoutHandle | null = null;

const clearExistingTimeout = (timeout: TimeoutHandle | null) => {
  if (timeout !== null) {
    clearTimeout(timeout);
  }
};

const updateLocalStorageContent = () => {
    const data = localStorage.getItem('formData');
    localStorageContent.value = data || 'Нет данных';
};

const formData = computed<FormData>(() => ({
    price: localPrice.value,
    qty: localQty.value,
    amount: localAmount.value,
    counter: counter.value
}));

const isSubmittable = computed(() =>
    localPrice.value && localQty.value && localAmount.value
);

const addEventLog = (type: EventLog['type'], message: string, data?: any) => {
    const event: EventLog = {
        id: Date.now(),
        timestamp: new Date(),
        type,
        message,
        data,
        localStorage: localStorage.getItem('formData') || 'Нет данных'
    };

    events.value.unshift(event);

    if (events.value.length > 50) {
        events.value = events.value.slice(0, 50);
    }
};

const formatTime = (date: Date) => {
    return date.toLocaleTimeString();
};

const getEventType = (type: EventLog['type']) => {
    switch (type) {
        case 'input_change': return 'event-input';
        case 'button_click': return 'event-button';
        case 'response_received': return 'event-response';
        default: return '';
    }
};

const updateChangeOrder = (field: 'price' | 'qty' | 'amount') => {
    const index = changeOrder.value.indexOf(field);
    if (index > -1) {
        changeOrder.value.splice(index, 1);
    }
    changeOrder.value.push(field);

    if (changeOrder.value.length > 3) {
        changeOrder.value = changeOrder.value.slice(-3);
    }
};

const getOldestField = (): FieldType | null => {
  return changeOrder.value[0] || null;
};

const recalculateOldestField = (changedField: 'price' | 'qty' | 'amount') => {
    const oldestField = getOldestField();

    if (oldestField === null || oldestField === changedField) {
        return;
    }

    addEventLog('input_change', `Изменено поле: ${changedField}`, {
        price: localPrice.value,
        qty: localQty.value,
        amount: localAmount.value
    });

    switch (oldestField) {
        case 'price':
            if (localQty.value !== 0) {
                localPrice.value = Number((localAmount.value / localQty.value).toFixed(2));
            }
            break;
        case 'qty':
            if (localPrice.value !== 0) {
                localQty.value = Number((localAmount.value / localPrice.value).toFixed(2));
            }
            break;
        case 'amount':
            localAmount.value = Number((localPrice.value * localQty.value).toFixed(2));
            break;
    }
};

const handleInputChange = (field: 'price' | 'qty' | 'amount') => {
    const debounceTime = 300;

    switch (field) {
        case 'price':
            clearExistingTimeout(priceTimeout);
            priceTimeout = setTimeout(() => {
                updateChangeOrder(field);
                recalculateOldestField(field);
                addEventLog('input_change', `Изменено поле: ${field}`, {
                    price: localPrice.value,
                    qty: localQty.value,
                    amount: localAmount.value
                });
            }, debounceTime);
            break;

        case 'qty':
            clearExistingTimeout(qtyTimeout);
            qtyTimeout = setTimeout(() => {
                updateChangeOrder(field);
                recalculateOldestField(field);
                addEventLog('input_change', `Изменено поле: ${field}`, {
                    price: localPrice.value,
                    qty: localQty.value,
                    amount: localAmount.value
                });
            }, debounceTime);
            break;

        case 'amount':
            clearExistingTimeout(amountTimeout);
            amountTimeout = setTimeout(() => {
                updateChangeOrder(field);
                recalculateOldestField(field);
                addEventLog('input_change', `Изменено поле: ${field}`, {
                    price: localPrice.value,
                    qty: localQty.value,
                    amount: localAmount.value
                });
            }, debounceTime);
            break;
    }
};

const simulateBackendCall = (data: FormData): Promise<{ success: boolean }> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const success = data.amount % 2 === 0;
            resolve({ success });
        }, 1000);
    });
};

const handleSubmit = async () => {
    isSubmitting.value = true;

    counter.value += 1;

    const submitData = { ...formData.value };

    addEventLog('button_click', 'Нажата кнопка отправки', submitData);

    try {
        const response = await simulateBackendCall(submitData);

        if (response.success) {
            localStorage.setItem('formData', JSON.stringify(submitData));
            updateLocalStorageContent();
        }

        addEventLog('response_received',
            response.success ? 'Данные успешно сохранены' : 'Ошибка сохранения данных',
            { response, currentData: formData.value }
        );

    } catch (error) {
        addEventLog('response_received', 'Ошибка при отправке данных', { error });
    } finally {
        isSubmitting.value = false;
    }
};

onMounted(() => {
    const savedData = localStorage.getItem('formData');
    if (savedData) {
        try {
            const parsedData: FormData = JSON.parse(savedData);
            localPrice.value = parsedData.price;
            localQty.value = parsedData.qty;
            localAmount.value = parsedData.amount;
            counter.value = parsedData.counter;
        } catch (error) {
            console.error('Ошибка загрузки данных из localStorage:', error);
        }
    }

    changeOrder.value = ['price', 'qty', 'amount'];

    updateLocalStorageContent();

    addEventLog('input_change', 'Компонент инициализирован');
});
</script>

<style lang="scss">
.form-view {
    display: flex;
}

.form-input,
.form-button {
    height: 42px;
    border-radius: 4px;
}

.form-input {
    width: 100%;
    max-width: 100%;
    padding: 0 16px;
    border-width: 1px;
    -webkit-appearance: none;
    -moz-appearance: textfield;
    appearance: textfield;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    &::placeholder {
        color: #bebebe;
    }
}

.form-button {
    width: 100%;
    border: 1px solid cornflowerblue;
    background-color: cornflowerblue;
    color: #fff;

    &:disabled {
        opacity: .5;
    }
}

.events-list {
    border: 1px solid #bebebe;
    margin: 0 16px;

    &__item {
        padding: 16px;

        &:nth-child(even) {
            background: #f1f2f4;
        }
    }
}
</style>