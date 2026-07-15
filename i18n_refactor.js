const fs = require('fs');
const path = require('path');

const formsDir = path.join(__dirname, 'src/components/forms');
const files = fs.readdirSync(formsDir).filter(f => f.endsWith('.tsx'));

const replacements = {
  '>İptal<': `>{t('forms.cancel')}<`,
  '>Kaydet<': `>{t('forms.save')}<`,
  '>Güncelle<': `>{t('forms.update')}<`,
  '>Sil<': `>{t('forms.delete')}<`,
  '>Kapat<': `>{t('forms.close')}<`,
  '>Tutar<': `>{t('forms.amount')}<`,
  '>Tarih<': `>{t('forms.date')}<`,
  '>Kategori<': `>{t('forms.category')}<`,
  '>Hesap<': `>{t('forms.account')}<`,
  '>Açıklama (İsteğe Bağlı)<': `>{t('forms.description')}<`,
  '>Gider<': `>{t('forms.expense')}<`,
  '>Gelir<': `>{t('forms.income')}<`,
  '>Gider Ekle<': `>{t('forms.addExpense')}<`,
  '>Gelir Ekle<': `>{t('forms.addIncome')}<`,
  '>Yemek Adı<': `>{t('forms.mealName')}<`,
  '>Miktar<': `>{t('forms.quantity')}<`,
  '>Birim<': `>{t('forms.unit')}<`,
  '>Kalori (Kcal)<': `>{t('forms.calories')}<`,
  '>Protein<': `>{t('forms.protein')}<`,
  '>Karb<': `>{t('forms.carbs')}<`,
  '>Yağ<': `>{t('forms.fat')}<`,
  '>Süre (Dakika)<': `>{t('forms.duration')}<`,
  '>Egzersiz Tipi<': `>{t('forms.exerciseType')}<`,
  '>Yakılan Kalori (Kcal)<': `>{t('forms.burnedCalories')}<`,
  '>Kişi / Kurum<': `>{t('forms.personOrInstitution')}<`,
  '>Son Ödeme Tarihi<': `>{t('forms.dueDate')}<`,
  '>Borç Verdim<': `>{t('forms.given')}<`,
  '>Borç Aldım<': `>{t('forms.taken')}<`
};

files.forEach(file => {
  const filePath = path.join(formsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  for (const [search, replace] of Object.entries(replacements)) {
    // using split join for global replacement
    content = content.split(search).join(replace);
  }

  if (content !== originalContent) {
    if (!content.includes("@/lib/i18n")) {
      content = "import { t } from '@/lib/i18n';\n" + content;
    }
    fs.writeFileSync(filePath, content, 'utf-8');
  }
});

console.log("i18n Refactoring complete.");
