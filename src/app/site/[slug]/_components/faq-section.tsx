import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function FaqSection({ faqs }: { faqs: any[] }) {
  if (!faqs || faqs.length === 0) return null

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container max-w-4xl mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Tanya Jawab</h2>
            <p className="text-muted-foreground text-lg md:text-xl">Pertanyaan yang sering diajukan mengenai perusahaan kami</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.id} value={`item-${index}`} className="bg-background rounded-xl px-6 mb-4 shadow-sm border-0">
                <AccordionTrigger className="text-left font-semibold text-lg py-6 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 whitespace-pre-wrap leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollReveal>
      </div>
    </section>
  )
}
