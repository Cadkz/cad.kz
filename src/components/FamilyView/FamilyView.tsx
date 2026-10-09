import Link from 'next/link'
import { ArticleBody } from '@/components/ArticleBody/ArticleBody'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { Container } from '@/components/Container/Container'
import { PickerBar } from '@/components/PickerBar/PickerBar'
import { PickerProvider } from '@/components/PickerProvider/PickerProvider'
import { PickerSteps } from '@/components/PickerSteps/PickerSteps'
import { PickerSummary } from '@/components/PickerSummary/PickerSummary'
import { ProductHeader } from '@/components/ProductHeader/ProductHeader'
import { ProductLayout } from '@/components/ProductLayout/ProductLayout'
import { ProductSection } from '@/components/ProductSection/ProductSection'
import { type FamilyPage, splitTitle } from '@/lib/families'
import { getContacts } from '@/lib/navigation'
import { catalogHref } from '@/lib/navigationHrefs'
import { parseBody } from '@/lib/richText'
import styles from './FamilyView.module.css'

/**
 * Страница семейства — шаблон «Товар»: слева список программ с галочками и их описания
 * (свёрнуты), справа итог с «Получить КП». Адреса старых страниц ведут к строке программы.
 */
export async function FamilyView({ family, pick }: { family: FamilyPage; pick: number | null }) {
  const contacts = await getContacts()
  const first = family.members[0]
  if (!first) return null
  const meta = {
    productId: first.id,
    productTitle: family.title,
    renewLabel: null,
    familySlug: family.slug,
    contacts: {
      phones: contacts.phones,
      whatsappHref: contacts.whatsappHref,
      hours: contacts.hours,
    },
  }
  const described = family.members.filter((m) => m.description)
  return (
    <main>
      <Container>
        <Breadcrumbs
          items={[
            { title: 'Каталог', href: catalogHref() },
            ...(family.vendor
              ? [{ title: family.vendor, href: catalogHref({ vendor: family.vendor }) }]
              : []),
            { title: family.title },
          ]}
        />
        <PickerProvider view={family.picker} meta={meta} pick={pick}>
          <ProductLayout
            asideLast
            header={
              <ProductHeader
                title={family.title}
                vendor={family.vendor}
                summary={family.intro}
                icon="layers"
                tasks={[]}
                requires={[]}
              />
            }
            aside={<PickerSummary />}
          >
            <ProductSection title="Выберите программы" id="config">
              <PickerSteps />
            </ProductSection>
            {described.length > 0 && (
              <ProductSection title="О программах" id="about">
                <div className={styles.list}>
                  {described.map((member) => (
                    <details key={member.id} className={styles.item}>
                      <summary className={styles.summary}>{splitTitle(member.title).label}</summary>
                      <ArticleBody blocks={parseBody(member.description ?? '')} />
                      {member.href && (
                        <Link href={member.href} className={styles.link}>
                          Отдельная страница программы
                        </Link>
                      )}
                    </details>
                  ))}
                </div>
              </ProductSection>
            )}
          </ProductLayout>
          <PickerBar />
        </PickerProvider>
      </Container>
    </main>
  )
}
