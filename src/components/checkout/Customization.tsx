import { FC, ChangeEvent, FormEvent, useState, memo } from 'react';
import { createWhatsAppLink } from '../../utils/helpers';

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
        <div className="radio-group">
            {options.map(option => (
                <div key={option} className="radio-option">
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

    const tennisOptionFields = ['bladeType', 'nameEngraving', 'toeGuard', 'finish', 'sticker', 'bag'];
    const leatherOptionFields = ['weight', 'nameEngraving', 'sticker', 'toeGuard', 'bag'];

    const options: Record<string, string[]> = {
        bladeType: ['Single Blade', 'Double Blade'],
        nameEngraving: ['Yes', 'No'],
        toeGuard: ['Premium Toe Guard', 'Normal Toe Guard'],
        finish: ['Ultra Finish', 'Normal Finish'],
        sticker: ['Wular Sports Sticker', 'Other Brand Sticker', 'No Sticker'],
        bag: ['Cushioned Premium Bag', 'Normal Bag'],
        weight: ['1100–1200 grams', '1200–1300 grams', '1300–1400 grams'],
    };

    const handleBatTypeSelect = (type: 'tennis' | 'leather') => {
        setBatType(type);
        setFormData({});
        setErrors({});
        setIsSubmitted(false);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
            if (!formData[field]) {
                newErrors[field] = 'Please make a selection for this option.';
            }
        });

        if (formData.nameEngraving === 'Yes' && (!formData.engravedName || formData.engravedName.trim() === '')) {
            newErrors.engravedName = 'Please enter the name to engrave.';
        }
        if (formData.sticker === 'Other Brand Sticker' && (!formData.otherStickerBrand || formData.otherStickerBrand.trim() === '')) {
            newErrors.otherStickerBrand = 'Please enter the sticker brand.';
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
            nameEngraving: "Name Engraving",
            engravedName: "  - Name",
            toeGuard: "Toe Guard Type",
            sticker: "Sticker Type",
            otherStickerBrand: "  - Sticker Brand",
            bag: "Bag Type",
        };

        const fieldOrder = batType === 'tennis'
            ? ['bladeType', 'finish', 'nameEngraving', 'engravedName', 'toeGuard', 'sticker', 'otherStickerBrand', 'bag']
            : ['weight', 'nameEngraving', 'engravedName', 'toeGuard', 'sticker', 'otherStickerBrand', 'bag'];

        fieldOrder.forEach(key => {
            if (formData[key]) {
                message += `*${fieldLabels[key]}:* ${formData[key]}\n`;
            }
        });

        window.open(createWhatsAppLink(message.trim()), '_blank');
        setIsSubmitted(true);
    };

    const renderFormSpecificOptions = () => {
        if (!batType) return null;

        if (batType === 'tennis') {
            return (
                <>
                    <CustomizationRadioGroup name="bladeType" label="Blade Type" options={options.bladeType} selectedValue={formData.bladeType} onChange={handleChange} error={errors.bladeType} />
                    <CustomizationRadioGroup name="finish" label="Finish Type" options={options.finish} selectedValue={formData.finish} onChange={handleChange} error={errors.finish} />
                </>
            );
        }

        if (batType === 'leather') {
            return <CustomizationRadioGroup name="weight" label="Weight Range" options={options.weight} selectedValue={formData.weight} onChange={handleChange} error={errors.weight} />;
        }
    };

    return (
        <section id="customize">
            <div className="container">
                <h2 className="section-title">Customize Your Bat</h2>

                {isSubmitted && (
                    <div className="success-message">
                        <p>✅ Your customization request has been sent to Wular Sports on WhatsApp. We will contact you shortly to finalize your order.</p>
                        <button className="btn" onClick={() => { setIsSubmitted(false); setBatType(null); }}>Start a New Customization</button>
                    </div>
                )}

                {!batType && !isSubmitted && (
                    <div className="bat-type-selector">
                        <p>First, select the type of bat you want to customize.</p>
                        <div>
                            <button className="btn bat-type-btn" onClick={() => handleBatTypeSelect('tennis')}>🏏 Tennis Bat</button>
                            <button className="btn bat-type-btn" onClick={() => handleBatTypeSelect('leather')}>🏏 Leather Bat</button>
                        </div>
                    </div>
                )}

                {batType && !isSubmitted && (
                    <form className="customization-form" onSubmit={handleSubmit} noValidate>
                        <button type="button" className="btn back-to-type" onClick={() => setBatType(null)}>Change Bat Type</button>
                        <h3 className="customization-heading">Customizing: {batType === 'tennis' ? 'Tennis Bat' : 'Leather Bat'}</h3>

                        {renderFormSpecificOptions()}

                        <CustomizationRadioGroup name="nameEngraving" label="Name Engraving" options={options.nameEngraving} selectedValue={formData.nameEngraving} onChange={handleChange} error={errors.nameEngraving} />
                        {formData.nameEngraving === 'Yes' && (
                            <div className="form-group indented">
                                <label className="form-label" htmlFor="engravedName">Enter the name to engrave (max 10 characters)</label>
                                <input type="text" id="engravedName" name="engravedName" value={formData.engravedName || ''} onChange={handleChange} maxLength={10} required />
                                {errors.engravedName && <p className="error-message">{errors.engravedName}</p>}
                            </div>
                        )}

                        <CustomizationRadioGroup name="toeGuard" label="Toe Guard Type" options={options.toeGuard} selectedValue={formData.toeGuard} onChange={handleChange} error={errors.toeGuard} />
                        <CustomizationRadioGroup name="sticker" label="Sticker Type" options={options.sticker} selectedValue={formData.sticker} onChange={handleChange} error={errors.sticker} />
                        {formData.sticker === 'Other Brand Sticker' && (
                            <div className="form-group indented">
                                <label className="form-label" htmlFor="otherStickerBrand">Enter the sticker brand (e.g., SG, SS, TON)</label>
                                <input type="text" id="otherStickerBrand" name="otherStickerBrand" value={formData.otherStickerBrand || ''} onChange={handleChange} required />
                                {errors.otherStickerBrand && <p className="error-message">{errors.otherStickerBrand}</p>}
                            </div>
                        )}

                        <CustomizationRadioGroup name="bag" label="Bag Type" options={options.bag} selectedValue={formData.bag} onChange={handleChange} error={errors.bag} />

                        <button type="submit" className="btn submit-customization">Submit Customization</button>
                    </form>
                )}
            </div>
        </section>
    );
});
