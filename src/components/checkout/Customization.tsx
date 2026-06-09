import { FC, ChangeEvent, FormEvent, useState, memo } from 'react';
import { createWhatsAppLink } from '../../utils/helpers';
import { Icon } from '../common/Icon';

interface CustomizationRadioGroupProps {
    name: string;
    label: string;
    options: string[];
    selectedValue: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    error?: string;
}

const CustomizationRadioGroup: FC<CustomizationRadioGroupProps> = memo(({ name, label, options, selectedValue, onChange, error }) => (
    <div className="form-group">
        <label className="form-label">{label}</label>
        <div className="radio-options-grid">
            {options.map(option => (
                <div key={option} className="radio-card">
                    <input
                        type="radio"
                        id={`${name}-${option.replace(/\s+/g, '-')}`}
                        name={name}
                        value={option}
                        checked={selectedValue === option}
                        onChange={onChange}
                        required
                    />
                    <label htmlFor={`${name}-${option.replace(/\s+/g, '-')}`}>{option}</label>
                </div>
            ))}
        </div>
        {error && <p className="error-message">{error}</p>}
    </div>
));

export const Customization = memo(() => {
    const [batType, setBatType] = useState<'tennis' | 'leather' | null>(null);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const tennisOptionFields = ['bladeType', 'finish', 'weight', 'height', 'handleType', 'toeGuard', 'sticker', 'bag'];
    const leatherOptionFields = ['weight', 'nameEngraving', 'toeGuard', 'sticker', 'bag'];

    const options: Record<string, string[]> = {
        bladeType: ['Single Blade', 'Double Blade'],
        finish: ['Polished', 'Raw (No Polish)', 'Burned', 'Burn + Polish'],
        height: ['35 inches', '36 inches'],
        handleType: ['Alpine Handle', 'Singapore Cane Handle'],
        toeGuard: ['Premium Chemical Toe Guard', 'Normal Toe Guard'],
        sticker: ['Wular Sports Sticker', 'Other Brand Sticker', 'No Sticker'],
        bag: ['Cushioned Premium Bag', 'Normal Bag'],
        weightLeather: ['1100–1200g', '1200–1300g', '1300–1400g'],
        weightSingle: ['800–850g', '850–900g', '900–950g'],
        weightDouble: ['950–1000g', '1000–1050g', '1050–1100g'],
        nameEngraving: ['Yes', 'No'],
    };

    const handleBatTypeSelect = (type: 'tennis' | 'leather') => {
        setBatType(type);
        setFormData({});
        setErrors({});
        setIsSubmitted(false);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // Reset dependent fields if blade type changes
        if (name === 'bladeType') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                weight: '',
                handleType: value === 'Double Blade' ? 'Singapore Cane Handle' : ''
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        const requiredFields = batType === 'tennis' ? tennisOptionFields : leatherOptionFields;

        requiredFields.forEach(field => {
            // HandleType is only required for Single Blade in Tennis
            if (field === 'handleType' && formData.bladeType === 'Double Blade') return;

            if (!formData[field]) {
                newErrors[field] = 'Selection required';
            }
        });

        if (batType === 'leather' && formData.nameEngraving === 'Yes' && (!formData.engravedName || formData.engravedName.trim() === '')) {
            newErrors.engravedName = 'Please enter name';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        let message = `*Custom Bat Request: ${batType === 'tennis' ? 'Tennis Bat' : 'Leather Bat'}*\n\n--- OPTIONS ---\n`;

        const fieldLabels: { [key: string]: string } = {
            bladeType: "Blade Type",
            finish: "Finish Type",
            weight: "Weight Range",
            height: "Bat Height",
            handleType: "Handle Type",
            nameEngraving: "Name Engraving",
            engravedName: "  - Name",
            toeGuard: "Toe Guard",
            sticker: "Sticker",
            otherStickerBrand: "  - Brand",
            bag: "Bag Type",
        };

        const fieldOrder = batType === 'tennis'
            ? ['bladeType', 'finish', 'weight', 'height', 'handleType', 'toeGuard', 'sticker', 'otherStickerBrand', 'bag']
            : ['weight', 'nameEngraving', 'engravedName', 'toeGuard', 'sticker', 'otherStickerBrand', 'bag'];

        fieldOrder.forEach(key => {
            if (formData[key]) {
                message += `*${fieldLabels[key]}:* ${formData[key]}\n`;
            }
        });

        window.dataLayer.push({
            event: 'whatsapp_submit',
            source: 'custom_bat',
            type: 'custom_bat_form',
            bat_type: batType,
        });
        window.open(createWhatsAppLink(message.trim()), '_blank');
        setIsSubmitted(true);
    };

    return (
        <section id="customize">
            <div className="container">
                <h2 className="section-title">Customize Your Bat</h2>

                {isSubmitted && (
                    <div className="success-message" style={{ textAlign: 'center', marginTop: '3rem' }}>
                        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>✅ Request sent! We'll contact you on WhatsApp to finalize.</p>
                        <button className="btn" onClick={() => { setIsSubmitted(false); setBatType(null); }}>Start New Customization</button>
                    </div>
                )}

                {!batType && !isSubmitted && (
                    <div className="bat-type-selector">
                        <p>Select your bat type to start customizing</p>
                        <div className="bat-type-grid">
                            <div className="bat-type-card" onClick={() => handleBatTypeSelect('tennis')}>
                                <div className="bat-icon-large">🏏</div>
                                <span className="bat-type-name">Tennis Bat</span>
                                <button className="btn btn-sm">Select</button>
                            </div>
                            <div className="bat-type-card" onClick={() => handleBatTypeSelect('leather')}>
                                <div className="bat-icon-large">🏏</div>
                                <span className="bat-type-name">Leather Bat</span>
                                <button className="btn btn-sm">Select</button>
                            </div>
                        </div>
                    </div>
                )}

                {batType && !isSubmitted && (
                    <form className="customization-form" onSubmit={handleSubmit} noValidate>
                        <div className="form-header-row">
                            <h3 className="customization-heading">{batType === 'tennis' ? 'Tennis Bat' : 'Leather Bat'}</h3>
                            <button type="button" className="back-to-type" onClick={() => setBatType(null)}>Change Type</button>
                        </div>

                        {batType === 'tennis' ? (
                            <>
                                <CustomizationRadioGroup name="bladeType" label="Blade Type" options={options.bladeType} selectedValue={formData.bladeType} onChange={handleChange} error={errors.bladeType} />
                                <CustomizationRadioGroup name="finish" label="Finish Type" options={options.finish} selectedValue={formData.finish} onChange={handleChange} error={errors.finish} />

                                {formData.bladeType && (
                                    <CustomizationRadioGroup
                                        name="weight"
                                        label="Weight Range"
                                        options={formData.bladeType === 'Single Blade' ? options.weightSingle : options.weightDouble}
                                        selectedValue={formData.weight}
                                        onChange={handleChange}
                                        error={errors.weight}
                                    />
                                )}

                                <CustomizationRadioGroup name="height" label="Bat Height" options={options.height} selectedValue={formData.height} onChange={handleChange} error={errors.height} />

                                {formData.bladeType === 'Single Blade' ? (
                                    <CustomizationRadioGroup name="handleType" label="Handle Type" options={options.handleType} selectedValue={formData.handleType} onChange={handleChange} error={errors.handleType} />
                                ) : formData.bladeType === 'Double Blade' ? (
                                    <div className="form-group">
                                        <label className="form-label">Handle Type</label>
                                        <p style={{ color: 'var(--golden)', fontSize: '0.9rem', fontStyle: 'italic', background: 'rgba(212, 175, 55, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                                            <Icon name="fa-info-circle" style={{ marginRight: '8px' }} />
                                            Double Blade bats always come with a premium Singapore Cane handle of top quality.
                                        </p>
                                    </div>
                                ) : null}
                            </>
                        ) : (
                            <CustomizationRadioGroup name="weight" label="Weight Range" options={options.weightLeather} selectedValue={formData.weight} onChange={handleChange} error={errors.weight} />
                        )}

                        {batType === 'leather' && (
                            <>
                                <CustomizationRadioGroup name="nameEngraving" label="Name Engraving" options={options.nameEngraving} selectedValue={formData.nameEngraving} onChange={handleChange} error={errors.nameEngraving} />
                                {formData.nameEngraving === 'Yes' && (
                                    <div className="form-group">
                                        <label className="form-label">Enter name (max 10 characters)</label>
                                        <input className="input-engraved" type="text" name="engravedName" value={formData.engravedName || ''} onChange={handleChange} maxLength={10} required />
                                        {errors.engravedName && <p className="error-message">{errors.engravedName}</p>}
                                    </div>
                                )}
                            </>
                        )}

                        <CustomizationRadioGroup name="toeGuard" label="Toe Guard" options={options.toeGuard} selectedValue={formData.toeGuard} onChange={handleChange} error={errors.toeGuard} />

                        <CustomizationRadioGroup name="sticker" label="Sticker" options={options.sticker} selectedValue={formData.sticker} onChange={handleChange} error={errors.sticker} />
                        {formData.sticker === 'Other Brand Sticker' && (
                            <div className="form-group">
                                <label className="form-label">Specify brand (SG, SS, etc.)</label>
                                <input className="input-engraved" type="text" name="otherStickerBrand" value={formData.otherStickerBrand || ''} onChange={handleChange} required />
                            </div>
                        )}

                        <CustomizationRadioGroup name="bag" label="Bag Type" options={options.bag} selectedValue={formData.bag} onChange={handleChange} error={errors.bag} />

                        <button type="submit" className="btn submit-customization">Request Customization via WhatsApp</button>
                    </form>
                )}
            </div>
        </section>
    );
});
