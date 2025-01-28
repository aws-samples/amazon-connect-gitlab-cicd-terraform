# This vocabulary is included just to show how one would create one if necessary. 
# Please note if you do add a vocabulary, it can take up to 90 minutes to delete (if you choose to do so)

# resource "aws_connect_vocabulary" "this" {
#   instance_id   = local.instance_id
#   name          = "example_us"
#   content       = "Phrase\tIPA\tSoundsLike\tDisplayAs\nLos-Angeles\t\t\tLos Angeles\nF.B.I.\tɛ f b i aɪ\t\tFBI\nEtienne\t\teh-tee-en\t"
#   language_code = "en-US"
# #   tags = {
# #     "Key1" = "Value1"
# #   }
# }